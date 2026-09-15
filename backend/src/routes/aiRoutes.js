const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const feedbackController = require('../controllers/feedbackController');
const { optionalAuth } = require('../middleware/authMiddleware');

/**
 * POST /api/ai/consult
 * Body: { tableId, sessionId, message, cartItems, restaurantId? }
 * Headers: Authorization: Bearer <token> (optional — cho phép cả guest)
 *
 * Response HTTP 200: xác nhận nhận request; kết quả trả về qua Socket.io
 * Response HTTP 400: payload không hợp lệ
 * Response HTTP 429: rate limit (10 req/phút/session)
 */
router.post('/consult', optionalAuth, aiController.consult);

/**
 * POST /api/ai/feedback
 * Body: { sessionId, tableId, query, answer, feedbackType, rating?, rejectedItems?, contextIds?, comment? }
 * Ghi nhận phản hồi Thumbs Up / Down theo Paper 01 Bước 4.2
 */
router.post('/feedback', optionalAuth, feedbackController.submitFeedback);

/**
 * GET /api/ai/feedback/stats
 */
router.get('/feedback/stats', feedbackController.getFeedbackStats);

/**
 * DELETE /api/ai/session/:sessionId
 * Xoá session hội thoại khỏi Redis (khi khách rời bàn)
 */
router.delete('/session/:sessionId', optionalAuth, aiController.clearSession);

module.exports = router;
