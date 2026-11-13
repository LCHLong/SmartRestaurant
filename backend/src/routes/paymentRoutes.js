const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/create-intent', paymentController.createPaymentIntent);

// Mock payment chỉ cho phép trong môi trường dev/test bởi Staff/Admin
router.post(
  '/mock',
  (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Mock payment is disabled in production' });
    }
    next();
  },
  verifyToken,
  authorizeRoles('waiter', 'admin', 'super_admin'),
  paymentController.mockPayment
);

router.post('/confirm', paymentController.confirmPayment); 
router.post('/webhook', express.raw({type: 'application/json'}), paymentController.handleWebhook);

// Xác nhận thanh toán tiền mặt bắt buộc phải do Nhân viên hoặc Quản lý thực hiện
router.post(
  '/confirm-cash',
  verifyToken,
  authorizeRoles('waiter', 'admin', 'super_admin'),
  paymentController.confirmCashPayment
);

module.exports = router;