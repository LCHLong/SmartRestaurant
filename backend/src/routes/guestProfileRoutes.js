const express = require('express');
const router = express.Router();
const guestProfileController = require('../controllers/guestProfileController');
const { verifyToken, verifyInternalOrUserAuth } = require('../middleware/authMiddleware');

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
 * Cập nhật tóm tắt phiên ngầm (được bảo vệ bởi Internal Secret hoặc User Token chống IDOR)
 */
router.post('/session-summary', verifyInternalOrUserAuth, guestProfileController.ingestSessionSummary);

module.exports = router;
