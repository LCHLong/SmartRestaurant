/**
 * feedbackRoutes.js
 * Tuyến API ghi nhận Telemetry & Phản hồi Thumbs Up / Down
 * Bước 4.2 Kế Hoạch 05 — Paper 01 Advancing RAG
 */

const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { optionalAuth } = require('../middleware/authMiddleware');

// POST /api/chat/feedback hoặc POST /api/feedback
router.post('/', optionalAuth, feedbackController.submitFeedback);

// GET /api/chat/feedback/stats
router.get('/stats', feedbackController.getFeedbackStats);

// GET /api/chat/feedback/ab-stats (A/B Testing Comparison Analytics)
router.get('/ab-stats', feedbackController.getAbStats);

// GET /api/chat/feedback/session/:sessionId
router.get('/session/:sessionId', feedbackController.getFeedbacksBySession);

module.exports = router;
