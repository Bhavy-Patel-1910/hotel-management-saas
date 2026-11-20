const express = require('express');
const router = express.Router();
const { placeOrder, getSessionOrders, getOrders, updateOrderStatus, getOrderStats } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (customer portal)
router.post('/place', placeOrder);
router.get('/session/:sessionToken', getSessionOrders);

// Protected routes (admin/staff)
router.get('/', protect, getOrders);
router.get('/stats', protect, getOrderStats);
router.put('/:id/status', protect, authorize('admin', 'manager', 'kitchen', 'waiter'), updateOrderStatus);

module.exports = router;
