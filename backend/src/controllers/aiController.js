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
const Joi = require('joi');

// ---------- Config ----------
const RATE_LIMIT_MAX = 10;       // request/phút/session
const RATE_LIMIT_TTL = 60;       // 1 phút (giây)
const SESSION_TTL = 1800;        // 30 phút
const MAX_HISTORY_TURNS = 6;     // Giữ 6 lượt hội thoại gần nhất
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
  userId: Joi.string().optional()
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

  // 2. Rate limit check
  const rateLimited = await checkRateLimit(sessionId);
  if (rateLimited) {
    return res.status(429).json({
      success: false,
      message: 'Quá nhiều yêu cầu. Vui lòng chờ 1 phút trước khi gửi tiếp.'
    });
  }

  // 3. Phản hồi HTTP 200 ngay (kết quả trả qua Socket.io)
  res.status(200).json({ success: true, message: 'Processing' });

  // ---- Phần còn lại chạy async, kết quả qua Socket.io ----
  try {
    // 4. Check Pipecat health (nếu down → fallback trực tiếp Gemini trong tương lai)
    const pipecatOk = await isPipecatHealthy();
    if (!pipecatOk) {
      io.to(socketRoom).emit('ai_error', {
        sessionId,
        message: 'AI service tạm thời không khả dụng. Vui lòng thử lại sau.'
      });
      return;
    }

    // 5. RAG — 2-Stage retrieval
    const { context, fallbackUsed } = await retrieveMenuContext(message, resolvedRestaurantId);

    // 6. Order history (nếu đăng nhập)
    const orderHistory = await getOrderHistory(userId);

    // 7. Session history (Redis)
    const history = await getSessionHistory(sessionId);

    // 8. Build payload cho Pipecat
    const pipecatPayload = {
      message,
      sessionId,
      tableId,
      cartItems,
      menuContext: context,
      orderHistory,
      conversationHistory: history,
      fallbackUsed,
      restaurantId: resolvedRestaurantId
    };

    // 9. Stream từ Pipecat → emit Socket.io
    let fullResponse = '';

    streamFromPipecat(
      pipecatPayload,

      // onToken: emit từng token
      (token) => {
        fullResponse += token;
        io.to(socketRoom).emit('ai_stream_token', { sessionId, token });
      },

      // onDone: emit final response + suggested items
      async (result) => {
        const finalText = result.text || fullResponse;
        const suggestedItems = result.suggestedItems || [];

        io.to(socketRoom).emit('ai_response', {
          sessionId,
          content: finalText,
          suggestedItems
        });

        // 10. Lưu lịch sử hội thoại
        await saveSessionHistory(sessionId, history, message, finalText);
      },

      // onError
      (err) => {
        console.error('[aiController] Pipecat error:', err.message);
        io.to(socketRoom).emit('ai_error', {
          sessionId,
          message: 'Aria tạm thời gặp sự cố. Bạn có thể thử lại hoặc gọi nhân viên hỗ trợ.'
        });
      }
    );

  } catch (err) {
    console.error('[aiController] Unexpected error:', err.message);
    try {
      io.to(socketRoom).emit('ai_error', {
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

  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'sessionId is required' });
  }

  try {
    await redis.del(`ai_session:${sessionId}`);
    await redis.del(`ai_ratelimit:${sessionId}`);
    return res.status(200).json({ success: true, message: 'Session cleared' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to clear session' });
  }
};
