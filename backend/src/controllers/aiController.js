/**
 * aiController.js
 * AI Gateway Controller — xử lý POST /api/ai/consult
 *
 * Luồng:
 *   1. Validate & rate-limit (Redis)
 *   2. RAG: lấy menu context từ Supabase/Redis (2-Stage)
 *   3. Lấy session history từ Redis
 *   4. Forward sang Pipecat Service (stream SSE)
 *   5. Emit từng token qua Socket.io → room table_{tableId}
 *   6. Sau khi done: lưu history vào Redis
 */

const redis = require('../config/redisClient');
const { getIO } = require('../config/socket');
const { retrieveMenuContext, getOrderHistory } = require('../services/ragService');
const { streamFromPipecat, isPipecatHealthy } = require('../services/pipecatClient');
const { getAbVariant } = require('../utils/abVariant');
const Joi = require('joi');

// ---------- Config ----------
const RATE_LIMIT_MAX = 10;       // request/phút/session
const RATE_LIMIT_TTL = 60;       // 1 phút (giây)
const SESSION_TTL = 1800;        // 30 phút
// Paper 01 yêu cầu 10 lượt (mỗi lượt = 1 cặp user+assistant = 2 phần tử)
// Giới hạn 10 lượt ≈ 20 phần tử trong mảng history
// Lý do: context window Groq LLaMA ~8K tokens, mỗi lượt ~150-200 tokens
// → 10 lượt ≈ 2000 tokens cho history, còn đủ chỗ cho system prompt + menu context
const MAX_HISTORY_TURNS = 10;
const DEFAULT_RESTAURANT_ID = process.env.DEFAULT_RESTAURANT_ID || '1';

// ---------- Validation Schema ----------
const consultSchema = Joi.object({
  tableId: Joi.string().max(20).required(),
  sessionId: Joi.string().uuid().required(),
  message: Joi.string().min(1).max(500).required(),
  cartItems: Joi.array().items(
    Joi.object({
      id: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
      name: Joi.string().required(),
      price: Joi.number().required(),
      quantity: Joi.number().integer().min(1).default(1)
    })
  ).default([]),
  restaurantId: Joi.string().optional(),
  userId: Joi.string().optional(),
  feedbackType: Joi.string().valid('thumbs_up', 'thumbs_down', 'detailed').optional(),
  rejectedItems: Joi.array().items(Joi.string()).optional()
});

// ---------- Helpers ----------

/**
 * Kiểm tra & tăng rate limit counter
 * @returns {boolean} true nếu vượt limit
 */
async function checkRateLimit(sessionId) {
  const key = `ai_ratelimit:${sessionId}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, RATE_LIMIT_TTL);
    }
    return count > RATE_LIMIT_MAX;
  } catch (_) {
    return false; // Nếu Redis lỗi, cho qua
  }
}

/**
 * Lấy lịch sử hội thoại từ Redis
 * @param {string} sessionId
 * @returns {Array<{role, content}>}
 */
async function getSessionHistory(sessionId) {
  const key = `ai_session:${sessionId}`;
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

/**
 * Lấy hồ sơ dài hạn (Archival Memory) của khách quen từ PostgreSQL/Redis
 * Căn cứ: MemGPT Architecture (Packer et al., 2023)
 * @param {string|null} userId
 * @returns {Object|null}
 */
async function getGuestProfile(userId) {
  if (!userId) return null;
  const cacheKey = `guest_profile:${userId}`;
  try {
    if (redis && typeof redis.get === 'function') {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }
  } catch (_) { /* cache miss */ }

  try {
    const { data } = await supabase
      .from('guest_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (data && redis && typeof redis.set === 'function') {
      await redis.set(cacheKey, JSON.stringify(data), { EX: 3600 }).catch(() => {});
    }
    return data || null;
  } catch (_) {
    return null;
  }
}

/**
 * Lưu lịch sử hội thoại vào Redis (rolling window MAX_HISTORY_TURNS)
 * @param {string} sessionId
 * @param {Array}  history
 * @param {string} userMsg
 * @param {string} assistantMsg
 */
async function saveSessionHistory(sessionId, history, userMsg, assistantMsg) {
  const key = `ai_session:${sessionId}`;
  const updated = [
    ...history,
    { role: 'user', content: userMsg },
    { role: 'assistant', content: assistantMsg }
  ].slice(-MAX_HISTORY_TURNS * 2); // giữ N lượt gần nhất (mỗi lượt 2 phần tử)

  try {
    await redis.set(key, JSON.stringify(updated), { EX: SESSION_TTL });
  } catch (_) { /* Ignore */ }
}

// ---------- Controller ----------

/**
 * POST /api/ai/consult
 */
exports.consult = async (req, res) => {
  // 1. Validate payload
  const { error, value } = consultSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request payload',
      details: error.details.map(d => d.message)
    });
  }

  const { tableId, sessionId, message, cartItems, restaurantId } = value;
  const userId = req.user?.id || value.userId || null;
  const resolvedRestaurantId = restaurantId || DEFAULT_RESTAURANT_ID;
  const io = getIO();
  const socketRoom = `table_${tableId}`;

  // 2. A/B Testing Traffic Split (Đã vô hiệu hóa cơ chế 50/50, chạy đồng nhất cho mọi client)
  // const abVariant = getAbVariant(sessionId); // Code 50/50 cũ
  const abVariant = 'variant_a_advanced'; // Hoặc 'default' - đảm bảo nhất quán 100% mọi máy

  // Ghi nhận lượt impression trong Redis Telemetry (nếu có)
  try {
    if (redis && typeof redis.incr === 'function') {
      redis.incr(`rag_telemetry:${abVariant}_impressions`).catch(() => {});
    }
  } catch (_) {}

  // 3. Rate limit check
  const rateLimited = await checkRateLimit(sessionId);
  if (rateLimited) {
    return res.status(429).json({
      success: false,
      message: 'Quá nhiều yêu cầu. Vui lòng chờ 1 phút trước khi gửi tiếp.'
    });
  }

  // 4. Phản hồi HTTP 200 ngay (kết quả trả qua Socket.io)
  res.status(200).json({ success: true, message: 'Processing', abVariant });

  // ---- Phần còn lại chạy async, kết quả qua Socket.io ----
  const sessionRoom = `session_${sessionId}`;
  const tableRoom = `table_${tableId}`;

  // Gộp room bằng chaining .to() để Socket.io tự động khử trùng lặp socket (tránh gửi lặp 2 lần)
  const emitToClient = (event, data) => {
    let target = io.to(sessionRoom);
    if (tableId && tableId !== 'unknown') {
      target = target.to(tableRoom);
    }
    target.emit(event, data);
  };

  try {
    // 5. RAG & MemGPT — Lấy thực đơn, lịch sử đơn hàng, hội thoại & hồ sơ dài hạn song song
    const [ragResult, orderHistory, history, guestProfile] = await Promise.all([
      retrieveMenuContext(message, resolvedRestaurantId),
      getOrderHistory(userId),
      getSessionHistory(sessionId),
      getGuestProfile(userId)
    ]);

    const { context, fallbackUsed } = ragResult;

    // 6. Build payload cho Pipecat
    // Luôn gửi context mảng hợp lệ (context || []), tránh gửi null gây lỗi 422 ở FastAPI
    const pipecatPayload = {
      message,
      sessionId,
      tableId,
      cartItems,
      menuContext: context || [],
      orderHistory,
      conversationHistory: history,
      guestProfile: guestProfile || null, // MemGPT Archival Memory
      fallbackUsed,
      restaurantId: resolvedRestaurantId,
      userId: userId || null,
      feedbackType: req.body.feedbackType,
      rejectedItems: req.body.rejectedItems,
      abVariant,
      enableRerank: true
    };

    // 7. Stream từ Pipecat → emit Socket.io
    let fullResponse = '';

    streamFromPipecat(
      pipecatPayload,

      // onToken: emit từng token trực tiếp tới client kèm thẻ nhánh
      (token) => {
        fullResponse += token;
        emitToClient('ai_stream_token', { sessionId, token, abVariant });
      },

      // onDone: emit final response + suggested items + reservation
      async (result) => {
        const finalText = result.text || fullResponse;
        const suggestedItems = result.suggestedItems || [];
        const reservation = result.reservation || null;

        emitToClient('ai_response', {
          sessionId,
          content: finalText,
          suggestedItems,
          reservation,
          abVariant
        });

        // Handoff Alert cho Waiter và Admin
        if (result.isHandoff) {
          const handoffPayload = result.handoffPayload || {
            sessionId,
            tableId,
            reason: 'ASSISTANCE_REQUIRED',
            summary: message,
            timestamp: new Date().toISOString()
          };
          try {
            io.to('waiter').emit('ai_handoff_alert', handoffPayload);
            io.to('admin').emit('ai_handoff_alert', handoffPayload);
            if (handoffPayload.reason === 'GROUP_SIZE_EXCEEDED') {
              io.to('waiter').emit('large_group_escalation', handoffPayload);
              io.to('admin').emit('large_group_escalation', handoffPayload);
            }
          } catch (e) {
            console.error('[aiController] Socket emit handoff error:', e.message);
          }
        }

        // 8. Lưu lịch sử hội thoại
        await saveSessionHistory(sessionId, history, message, finalText);
      },

      // onError
      (err) => {
        console.error('[aiController] Pipecat error:', err.message);
        emitToClient('ai_error', {
          sessionId,
          message: 'Aria tạm thời gặp sự cố. Bạn có thể thử lại hoặc gọi nhân viên hỗ trợ.'
        });
      }
    );

  } catch (err) {
    console.error('[aiController] Unexpected error:', err.message);
    try {
      emitToClient('ai_error', {
        sessionId,
        message: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'
      });
    } catch (_) { /* Socket emit failed */ }
  }
};

/**
 * DELETE /api/ai/session/:sessionId
 * Xoá session Redis khi khách rời bàn
 */
exports.clearSession = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user?.id || null;

  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'sessionId is required' });
  }

  try {
    // MemGPT: Nếu là khách quen đã đăng nhập, đọc lại hội thoại trước khi xóa để kích hoạt tác vụ tóm tắt ngầm
    if (userId) {
      getSessionHistory(sessionId).then(async (history) => {
        if (history && history.length >= 2) {
          try {
            const guestProfileController = require('./guestProfileController');
            // Tìm kiếm các tín hiệu dị ứng hoặc khẩu vị trong hội thoại
            const textCorpus = history.map(h => h.content).join(' ').toLowerCase();
            const detectedAllergies = [];
            const allergensCheck = ['đậu phộng', 'hải sản', 'tôm', 'cua', 'trứng', 'sữa', 'gluten', 'bò'];
            for (const a of allergensCheck) {
              if (textCorpus.includes(`dị ứng ${a}`) || textCorpus.includes(`không ăn được ${a}`) || textCorpus.includes(`không ăn ${a}`)) {
                detectedAllergies.push(a);
              }
            }

            let detectedSpice = undefined;
            if (textCorpus.includes('không ăn cay') || textCorpus.includes('không cay')) {
              detectedSpice = 'không cay';
            } else if (textCorpus.includes('ít cay') || textCorpus.includes('hơi cay')) {
              detectedSpice = 'ít cay';
            } else if (textCorpus.includes('cay nhiều') || textCorpus.includes('ăn cay giỏi')) {
              detectedSpice = 'cay nồng';
            }

            let detectedZone = undefined;
            if (textCorpus.includes('ngoài trời') || textCorpus.includes('thoáng mát')) {
              detectedZone = 'ngoài trời';
            } else if (textCorpus.includes('phòng vip') || textCorpus.includes('phòng riêng')) {
              detectedZone = 'phòng VIP';
            } else if (textCorpus.includes('cạnh cửa sổ') || textCorpus.includes('gần cửa sổ')) {
              detectedZone = 'cạnh cửa sổ';
            }

            const mockReq = {
              body: {
                userId,
                sessionId,
                detectedAllergies,
                detectedSpice,
                detectedZone,
                favoriteDishes: [],
                memoryFacts: [
                  `Khách đã tương tác trong phiên ${sessionId}`
                ]
              }
            };
            const mockRes = {
              status: () => ({ json: () => {} })
            };
            await guestProfileController.ingestSessionSummary(mockReq, mockRes);
          } catch (sumErr) {
            console.warn('[aiController] Background session summarizer failed:', sumErr.message);
          }
        }
      }).catch(() => {});
    }

    if (redis && typeof redis.del === 'function') {
      await Promise.all([
        redis.del(`ai_session:${sessionId}`),
        redis.del(`ai_ratelimit:${sessionId}`),
        redis.del(`reservation_state:${sessionId}`)
      ]);
    }
    return res.status(200).json({ success: true, message: 'Session cleared' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to clear session' });
  }
};

// Re-export để các module khác có thể dùng trực tiếp từ aiController (backward compat)
exports.getAbVariant = getAbVariant;

