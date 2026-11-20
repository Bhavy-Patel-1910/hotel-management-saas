const express = require('express');
const router = express.Router();
const {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  resetStaffPassword,
  updateRestaurantSettings
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const Restaurant = require('../models/Restaurant');

router.use(protect);

// Restaurant profile & settings
router.get('/', async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.restaurantId);
    res.json({ success: true, data: restaurant });
  } catch (error) { next(error); }
});

router.put('/', authorize('admin'), upload.single('logo'), async (req, res, next) => {
  try {
    // FIX: Whitelist allowed fields — prevents mass assignment of sensitive fields
    // (subscriptionPlan, isActive, subscriptionExpiry, etc. are Super Admin only)
    const { name, phone, address, city, state, pincode, gstNumber, gstPercentage, serviceCharge, openingTime, closingTime } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber;
    if (gstPercentage !== undefined) updateData.gstPercentage = Number(gstPercentage);
    if (serviceCharge !== undefined) updateData.serviceCharge = Number(serviceCharge);
    if (openingTime !== undefined) updateData.openingTime = openingTime;
    if (closingTime !== undefined) updateData.closingTime = closingTime;
    if (req.file) { updateData.logo = `/uploads/${req.file.filename}`; }

    // Handle nested settings if sent as string or object
    if (req.body['settings[requireOrderApproval]'] !== undefined) {
      updateData.settings = updateData.settings || {};
      updateData.settings.requireOrderApproval = req.body['settings[requireOrderApproval]'] === 'true' || req.body['settings[requireOrderApproval]'] === true;
    }
    if (req.body['settings[allowCashPayment]'] !== undefined) {
      updateData.settings = updateData.settings || {};
      updateData.settings.allowCashPayment = req.body['settings[allowCashPayment]'] === 'true' || req.body['settings[allowCashPayment]'] === true;
    }
    if (req.body['settings[allowOnlinePayment]'] !== undefined) {
      updateData.settings = updateData.settings || {};
      updateData.settings.allowOnlinePayment = req.body['settings[allowOnlinePayment]'] === 'true' || req.body['settings[allowOnlinePayment]'] === true;
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.restaurantId,
      updateData,
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: restaurant });
  } catch (error) { next(error); }
});

// Staff management
router.get('/staff', authorize('admin', 'manager'), getStaff);
router.post('/staff', authorize('admin', 'manager'), createStaff);
router.put('/staff/:id', authorize('admin', 'manager'), updateStaff);
router.delete('/staff/:id', authorize('admin'), deleteStaff);
router.post('/staff/:id/reset-password', authorize('admin'), resetStaffPassword);

module.exports = router;
