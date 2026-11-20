const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getSessionBill,
  markCashPayment,
  getPayments,
  getRevenueStats,
  razorpayWebhook
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// Public customer routes
router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyRazorpayPayment);
router.get('/bill/:sessionToken', getSessionBill);
router.post('/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

// Protected admin routes
router.use(protect);
router.get('/', authorize('admin', 'manager'), getPayments);
router.post('/cash/:tableSessionId', authorize('admin', 'manager', 'waiter'), markCashPayment);
router.get('/revenue', authorize('admin', 'manager'), getRevenueStats);

module.exports = router;
