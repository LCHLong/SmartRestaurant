/**
 * reservationRoutes.js
 * Phase 5 - Routes cho hệ thống Đặt bàn trước
 *
 * Rate Limiting:
 *   - POST /api/reservations: 5 requests / 15 phút / IP
 *   - POST /api/reservations/cancel-by-token: 10 requests / 15 phút / IP
 *
 * Auth:
 *   - Public: available-slots, lookup, cancel-by-token
 *   - optionalAuth: createReservation (guest + logged-in users)
 *   - verifyToken + roles: getReservations, getById, updateStatus, checkIn, reallocate
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// ─── Rate Limiters ──────────────────────────────────────────────────────────

/**
 * Giới hạn đặt bàn: 5 requests / 15 phút / IP (Chống spam bot đặt ảo)
 */
const bookingRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Bạn đã gửi quá nhiều yêu cầu đặt bàn. Vui lòng thử lại sau 15 phút.',
    },
  },
});

/**
 * Giới hạn tra cứu: 20 requests / 15 phút / IP
 */
const lookupRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Quá nhiều yêu cầu tra cứu. Vui lòng thử lại sau.' },
  },
});

// ─── Public Routes ──────────────────────────────────────────────────────────

/** Tra cứu slot bàn trống theo ngày + số khách */
router.get('/available-slots', reservationController.getAvailableSlots);

/** Tra cứu đặt bàn bằng booking_code + 4 số cuối điện thoại (Chống IDOR) */
router.get('/lookup', lookupRateLimiter, reservationController.lookupReservation);

/** Hủy đặt bàn qua link email (Signed JWT Token) */
router.post('/cancel-by-token', reservationController.cancelByToken);

// ─── Semi-Public Routes (optional auth) ────────────────────────────────────

/** Đặt bàn mới (guest hoặc logged-in user) — Rate limited */
router.post(
  '/',
  bookingRateLimiter,
  authMiddleware.optionalAuth,
  reservationController.createReservation
);

/** Tạo phiên thanh toán cọc Stripe (cho nhóm >= 6 người) */
router.post('/:id/deposit-intent', reservationController.createDepositPaymentIntent);

/** Xác nhận thanh toán cọc giả lập trong môi trường dev / demo */
router.post('/:id/mock-deposit', reservationController.confirmMockDeposit);

// ─── Staff Routes (Waiter + Admin) ─────────────────────────────────────────

router.use(authMiddleware.verifyToken);

/** Lấy danh sách bàn bị buffer cờ sắp có reservation (cho TableMapPage) */
router.get('/buffer-flags', reservationController.getBufferFlags);

/** Lấy cảnh báo Overstay trong ngày hôm nay */
router.get(
  '/overstay-alerts',
  roleMiddleware.authorizeRoles('waiter', 'admin', 'super_admin'),
  reservationController.getOverstayAlerts
);

/** Lấy danh sách đặt bàn (filter theo ngày, status) */
router.get(
  '/',
  roleMiddleware.authorizeRoles('waiter', 'admin', 'super_admin'),
  reservationController.getReservations
);

/** Lấy chi tiết 1 đặt bàn */
router.get(
  '/:id',
  roleMiddleware.authorizeRoles('waiter', 'admin', 'super_admin'),
  reservationController.getReservationById
);

/** Cập nhật trạng thái đặt bàn */
router.patch(
  '/:id/status',
  roleMiddleware.authorizeRoles('waiter', 'admin', 'super_admin'),
  reservationController.updateReservationStatus
);

/** Check-in khách đến — gán bàn thực tế */
router.patch(
  '/:id/check-in',
  roleMiddleware.authorizeRoles('waiter', 'admin', 'super_admin'),
  reservationController.checkInReservation
);

/** 1-Click Đổi bàn dự phòng khi Overstay */
router.post(
  '/:id/reallocate',
  roleMiddleware.authorizeRoles('waiter', 'admin', 'super_admin'),
  reservationController.reallocateTable
);

module.exports = router;
