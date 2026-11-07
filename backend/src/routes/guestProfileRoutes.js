const express = require('express');
const router = express.Router();
const guestProfileController = require('../controllers/guestProfileController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * GET /api/guest-profile/me
 * Lấy hồ sơ dài hạn khách quen (Archival Memory)
 */
router.get('/me', verifyToken, guestProfileController.getMyProfile);

/**
 * PUT /api/guest-profile/me
 * Cập nhật hồ sơ dài hạn (có bảo vệ Allergy Safety Latch)
 */
router.put('/me', verifyToken, guestProfileController.updateMyProfile);

/**
 * GET /api/guest-profile/memories
 * Lấy danh sách ký ức hồi tưởng (Recall Memory)
 */
router.get('/memories', verifyToken, guestProfileController.getMyMemories);

/**
 * POST /api/guest-profile/session-summary
 * POST /api/guest-profile/ingest-summary (Alias)
 * Cập nhật tóm tắt phiên ngầm (gọi bởi internal cron hoặc AI service)
 */
router.post('/session-summary', guestProfileController.ingestSessionSummary);
router.post('/ingest-summary', guestProfileController.ingestSessionSummary);

module.exports = router;

