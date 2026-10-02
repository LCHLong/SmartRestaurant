/**
 * shiftRoutes.js
 * Phase 5 - Routes cho hệ thống Quản lý ca làm việc
 *
 * Auth: Tất cả routes yêu cầu verifyToken
 * Admin-only: CRUD shifts, assign/remove roster, approve swap, attendance report
 * Staff: xem lịch cá nhân, gửi swap request, điểm danh
 */

const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Tất cả routes yêu cầu đăng nhập
router.use(authMiddleware.verifyToken);

// ─── Shifts Configuration (Admin only) ─────────────────────────────────────

router.get(
  '/admin/shifts',
  roleMiddleware.authorizeRoles('admin', 'super_admin'),
  shiftController.getShifts
);

router.post(
  '/admin/shifts',
  roleMiddleware.authorizeRoles('admin', 'super_admin'),
  shiftController.createShift
);

router.put(
  '/admin/shifts/:id',
  roleMiddleware.authorizeRoles('admin', 'super_admin'),
  shiftController.updateShift
);

router.delete(
  '/admin/shifts/:id',
  roleMiddleware.authorizeRoles('admin', 'super_admin'),
  shiftController.deleteShift
);

// ─── Roster Management (Admin) ──────────────────────────────────────────────

router.get(
  '/admin/rosters',
  roleMiddleware.authorizeRoles('admin', 'super_admin'),
  shiftController.getRosters
);

router.post(
  '/admin/rosters/assign',
  roleMiddleware.authorizeRoles('admin', 'super_admin'),
  shiftController.assignShift
);

router.delete(
  '/admin/rosters/:id',
  roleMiddleware.authorizeRoles('admin', 'super_admin'),
  shiftController.removeAssignment
);

// ─── Attendance Report (Admin) ───────────────────────────────────────────────

router.get(
  '/admin/attendance',
  roleMiddleware.authorizeRoles('admin', 'super_admin'),
  shiftController.getAttendanceReport
);

/** Admin duyệt yêu cầu đổi ca */
router.patch(
  '/admin/swap-requests/:id/approve',
  roleMiddleware.authorizeRoles('admin', 'super_admin'),
  shiftController.approveSwapRequest
);

// ─── Staff Portal ────────────────────────────────────────────────────────────

/** Xem lịch trực cá nhân */
router.get('/my-shifts', shiftController.getMyShifts);

/** Lấy QR Token động (TTL 30s) để hiển thị màn hình POS */
router.get(
  '/attendance/qr-token',
  roleMiddleware.authorizeRoles('admin', 'super_admin'),
  shiftController.getAttendanceQRToken
);

/** Nhân viên quét QR điểm danh vào ca */
router.post('/attendance/check-in', shiftController.checkInShift);

/** Nhân viên điểm danh kết thúc ca */
router.post('/attendance/check-out', shiftController.checkOutShift);

/** Xem danh sách yêu cầu đổi ca */
router.get('/swap-requests', shiftController.getSwapRequests);

/** Nhân viên gửi yêu cầu đổi ca */
router.post('/swap-requests', shiftController.createSwapRequest);

/** Đồng nghiệp xác nhận/từ chối yêu cầu đổi ca */
router.patch('/swap-requests/:id/respond', shiftController.respondSwapRequest);

module.exports = router;
