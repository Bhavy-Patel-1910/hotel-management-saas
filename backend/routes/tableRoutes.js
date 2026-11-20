const express = require('express');
const router = express.Router();
const { getTables, createTable, updateTable, deleteTable, regenerateQR, getTableByToken } = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/auth');

// Public route - scan QR
router.get('/scan/:token', getTableByToken);

// Protected routes
router.get('/', protect, getTables);
router.post('/', protect, authorize('admin', 'manager'), createTable);
router.put('/:id', protect, authorize('admin', 'manager'), updateTable);
router.delete('/:id', protect, authorize('admin', 'manager'), deleteTable);
router.post('/:id/regenerate-qr', protect, authorize('admin', 'manager'), regenerateQR);

module.exports = router;
