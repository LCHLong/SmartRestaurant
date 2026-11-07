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
const supabase = require('../config/supabaseClient');
const { getIO } = require('../config/socket');
const { retrieveMenuContext, getOrderHistory } = require('../services/ragService');
const { streamFromPipecat, isPipecatHealthy, summarizeSessionWithAI } = require('../services/pipecatClient');
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
 * Lấy các mẩu ký ức hồi tưởng (MemGPT Recall / Archival Memory) từ CSDL
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<Array<string>>}
 */
async function getRecallMemories(userId, limit = 5) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('guest_memories')
      .select('content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map(item => item.content).filter(Boolean);
  } catch (_) {
    return [];
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
    const [ragResult, orderHistory, history, guestProfile, recallMemories] = await Promise.all([
      retrieveMenuContext(message, resolvedRestaurantId),
      getOrderHistory(userId),
      getSessionHistory(sessionId),
      getGuestProfile(userId),
      getRecallMemories(userId)
    ]);

    const { context, fallbackUsed } = ragResult;

    // 5.1 Cấu trúc hoá ngữ cảnh hồ sơ khách quen & ký ức MemGPT
    const isReturningGuest = Boolean(
      guestProfile && (
        (guestProfile.visit_count || 1) > 1 ||
        (Array.isArray(guestProfile.allergies) && guestProfile.allergies.length > 0) ||
        (Array.isArray(guestProfile.favorite_dishes) && guestProfile.favorite_dishes.length > 0)
      )
    );

    const guestMemoryFacts = guestProfile ? {
      isReturningGuest,
      visitCount: guestProfile.visit_count || 1,
      allergies: guestProfile.allergies || [],
      dietaryPreferences: guestProfile.dietary_preferences || {},
      spicePreference: guestProfile.spice_preference || 'vừa',
      preferredZone: guestProfile.preferred_zone || null,
      favoriteDishes: guestProfile.favorite_dishes || [],
      specialNotes: guestProfile.special_notes || null,
      recentMemories: recallMemories || []
    } : null;

    // 6. Build payload cho Pipecat
    // Luôn gửi context mảng hợp lệ (context || []), tránh gửi null gây lỗi 422 ở FastAPI
    const pipecatPayload = {
      message,
      sessionId,
      tableId,
      cartItems,
      context: context || [],
      menuContext: context || [],
      orderHistory,
      conversationHistory: history,
      guestProfile: guestProfile || null, // MemGPT Core Human Memory
      guest_profile: guestProfile || null,
      guestContext: guestMemoryFacts,
      guest_context: guestMemoryFacts,
      recallMemories: recallMemories || [], // MemGPT Archival Semantic Facts
      recall_memories: recallMemories || [],
      fallbackUsed,
      restaurantId: resolvedRestaurantId,
      userId: userId || null,
      user_id: userId || null,
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

        // 9. Auto-checkpoint tóm tắt ngầm cho khách quen:
        // Kích hoạt khi có:
        // - Đặt bàn thành công (reservation)
        // - Phát hiện khiếu nại / phàn nàn / cần trợ giúp (complaint / handoff / negative feedback)
        // - Ngưỡng lượt hội thoại (mỗi 4 lượt hoặc từ 10 lượt trở lên)
        if (userId) {
          const turnCount = history.length + 2;
          const isComplaint = Boolean(result.isHandoff) ||
            Boolean(result.handoffPayload && (result.handoffPayload.reason === 'COMPLAINT' || result.handoffPayload.reason === 'ASSISTANCE_REQUIRED')) ||
            (req.body.feedbackType === 'thumbs_down') ||
            /khiếu nại|phàn nàn|thất vọng|không hài lòng|quá tệ|chất lượng kém/i.test(message);

          const mentionsTasteOrAllergy = /dị\s*ứng|không\s*ăn\s*(?:được)?|kiêng|khẩu\s*vị|không\s*cay|ít\s*cay|ăn\s*chay/i.test(message);

          const shouldCheckpoint = Boolean(reservation) ||
            isComplaint ||
            mentionsTasteOrAllergy ||
            (turnCount >= 4 && turnCount % 4 === 0);

          if (shouldCheckpoint) {
            const fullHistory = [
              ...history,
              { role: 'user', content: message },
              { role: 'assistant', content: finalText }
            ];
            triggerBackgroundSummarizer(sessionId, userId, fullHistory).catch((err) => {
              console.warn('[aiController] triggerBackgroundSummarizer error (non-blocking):', err?.message || err);
            });
          }
        }
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
 * Tác vụ tóm tắt phiên ngầm (MemGPT Auto-Checkpoint & Write-Back)
 * Gọi AI Microservice (FastAPI POST /api/memory/summarize-session) để bóc tách tri thức,
 * sau đó cập nhật an toàn vào guest_profiles & guest_memories với Allergy Safety Latch.
 *
 * @param {string} sessionId
 * @param {string} userId
 * @param {Array}  [historyOpt]
 */
async function triggerBackgroundSummarizer(sessionId, userId, historyOpt = null) {
  if (!userId) return;

  try {
    const history = historyOpt || (sessionId ? await getSessionHistory(sessionId) : []);
    if (!history || history.length < 2) return;

    // 1. Lấy profile hiện tại từ cache/DB
    const currentProfile = await getGuestProfile(userId);

    // 2. Gọi AI Service để bóc tách và hợp nhất (Allergy Safety Latch)
    let summaryResult = null;
    try {
      summaryResult = await summarizeSessionWithAI({
        sessionId,
        userId,
        conversationHistory: history,
        currentProfile: currentProfile || null
      });
    } catch (aiErr) {
      console.warn('[aiController] AI Service summarize-session failed, using fallback:', aiErr.message);
    }

    // 3. Chuẩn bị payload đồng bộ với guestProfileController.ingestSessionSummary
    const guestProfileController = require('./guestProfileController');
    let summaryPayload;

    if (summaryResult) {
      summaryPayload = {
        userId,
        sessionId,
        detectedAllergies: summaryResult.allergies || [],
        detectedSpice: summaryResult.spice_preference || undefined,
        detectedZone: summaryResult.preferred_zone || undefined,
        favoriteDishes: summaryResult.favorite_dishes || [],
        newSpecialNotes: summaryResult.special_notes || undefined,
        memoryFacts: summaryResult.memory_facts || [
          `Khách đã tương tác trong phiên ${sessionId}`
        ]
      };
    } else {
      // Fallback: trích xuất trực tiếp bằng keyword/regex nếu AI microservice không phản hồi
      const fullUserText = history
        .filter(h => h.role === 'user')
        .map(h => h.content || '')
        .join(' ')
        .toLowerCase();

      const fallbackAllergens = ['đậu phộng', 'lạc', 'hải sản', 'tôm', 'cua', 'mực', 'cá', 'trứng', 'sữa', 'gluten', 'bột mì', 'bò', 'đậu nành', 'mật ong', 'nấm', 'hành', 'tỏi', 'sầu riêng'];
      const detected = [];
      for (const a of fallbackAllergens) {
        if (new RegExp(`(?:dị\\s*ứng|không\\s*ăn|kiêng).*?${a}`, 'i').test(fullUserText) ||
            new RegExp(`${a}.*?(?:dị\\s*ứng|không\\s*ăn|kiêng)`, 'i').test(fullUserText)) {
          detected.push(a);
        }
      }

      // Regex bắt động tên thực phẩm dị ứng
      const dynamicMatch = fullUserText.match(/(?:bị\s+)?dị\s*ứng\s*(?:với|về)?\s*([a-zà-ỹ0-9\s]+?)(?:[,.;\n]|$|\bcòn\b|\bvà\b|\bnhưng\b)/i);
      if (dynamicMatch && dynamicMatch[1]) {
        const cand = dynamicMatch[1].trim();
        if (cand.length >= 2 && cand.length <= 30 && !detected.includes(cand)) {
          detected.push(cand);
        }
      }

      let spice = undefined;
      if (/không\s*(?:thích\s*)?(?:ăn\s*)?cay|không\s*cay|hết\s*(?:thích\s*)?(?:ăn\s*)?cay|đừng\s*bỏ\s*ớt|bỏ\s*cay|sợ\s*cay|khỏi\s*cay/i.test(fullUserText)) {
        spice = 'không cay';
      } else if (/ít\s*cay|hơi\s*cay|cay\s*nhẹ/i.test(fullUserText)) {
        spice = 'ít cay';
      } else if (/mặn\s*ngọt\s*chua\s*cay\s*đều\s*vị/i.test(fullUserText)) {
        spice = 'vừa';
      } else if (/ăn\s*cay|thích\s*cay|cay\s*nồng|rất\s*cay/i.test(fullUserText)) {
        spice = 'cay';
      }

      // Trích xuất ghi chú khẩu vị (loại trừ các câu lệnh điều khiển)
      const notes = [];
      const userRawCombined = history.filter(h => h.role === 'user').map(h => h.content || '').join('\n');
      for (const chunk of userRawCombined.split(/[\n\r.?!]+/)) {
        const trimmed = chunk.trim();
        if (!trimmed || trimmed.length < 5) continue;
        if (/^(?:giới\s*thiệu|gợi\s*ý|tư\s*vấn|tìm\s*món|cập\s*nhật\s*(?:lại)?|nhắc\s*lại|xem\s*thực\s*đơn|xin\s*chào|chào\s*bạn|hello)/i.test(trimmed)) continue;
        if (/cập\s*nhật\s*lại\s*khẩu\s*vị|giới\s*thiệu\s*món|gợi\s*ý\s*món/i.test(trimmed)) continue;
        if (/^(?:tôi\s*)?(?:không\s*(?:thích\s*)?(?:ăn\s*)?cay|ăn\s*cay|thích\s*cay)(?:\s*nữa)?$/i.test(trimmed)) continue;
        if (/^(?:tôi\s*)?(?:bị\s*)?dị\s*ứng\s*(?:với)?\s*[a-zà-ỹA-ZÀ-Ỹ0-9\s]+$/i.test(trimmed)) continue;

        if (/món\s*chính|món\s*tráng\s*miệng|mặn\s*ngọt|chua\s*cay|thích\s*ăn|thích\s*uống|thích\s*món|ăn\s*chay/i.test(trimmed)) {
          let cl = trimmed.replace(/^khẩu\s*vị\s*(?:của\s*tôi\s*)?là\s*:\s*/i, '')
                          .replace(/(?:tôi\s*)?(?:bị\s*)?dị\s*ứng\s*(?:với)?\s*[a-zà-ỹ0-9\s]+/i, '')
                          .trim().replace(/^[,;:-]+|[,;:-]+$/g, '');
          if (cl.length >= 5 && !notes.includes(cl)) notes.push(cl);
        }
      }

      summaryPayload = {
        userId,
        sessionId,
        detectedAllergies: detected,
        detectedSpice: spice,
        newSpecialNotes: notes.length > 0 ? notes.join('; ') : undefined,
        favoriteDishes: [],
        memoryFacts: detected.length > 0 ? [`Khách có nhắc dị ứng: ${detected.join(', ')}`] : [`Khách đã tương tác trong phiên ${sessionId}`]
      };
    }

    const mockReq = { body: summaryPayload };
    const mockRes = { status: () => ({ json: () => {} }) };
    await guestProfileController.ingestSessionSummary(mockReq, mockRes);
  } catch (err) {
    console.warn('[aiController] triggerBackgroundSummarizer error:', err.message);
  }
}

/**
 * DELETE /api/ai/session/:sessionId
 * Xoá session Redis khi khách rời bàn hoặc kết thúc phiên
 */
exports.clearSession = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user?.id || req.body?.userId || req.query?.userId || null;

  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'sessionId is required' });
  }

  try {
    // 1. Đọc lịch sử hội thoại từ Redis TRƯỚC KHI xóa key
    let history = [];
    if (redis && typeof redis.get === 'function') {
      try {
        const raw = await redis.get(`ai_session:${sessionId}`);
        if (raw) history = JSON.parse(raw);
      } catch (_) {}
    }

    // 2. Kích hoạt tóm tắt phiên ngầm nếu có lịch sử tương tác
    if (userId && history && history.length >= 2) {
      triggerBackgroundSummarizer(sessionId, userId, history).catch((err) => {
        console.warn('[aiController] clearSession triggerBackgroundSummarizer error (non-blocking):', err?.message || err);
      });
    }

    // 3. Xóa Redis keys sau khi đã đọc lịch sử
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
exports.triggerBackgroundSummarizer = triggerBackgroundSummarizer;
exports.getRecallMemories = getRecallMemories;
exports.getGuestProfile = getGuestProfile;

