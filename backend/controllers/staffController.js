const User = require('../models/User');

// Admin: Get all staff
const getStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ restaurant: req.restaurantId }).sort('name');
    res.json({ success: true, data: staff });
  } catch (error) { next(error); }
};

// Admin: Create staff member
const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, permissions } = req.body;
    const staff = await User.create({
      restaurant: req.restaurantId,
      name,
      email,
      password,
      role,
      phone,
      permissions,
    });
    res.status(201).json({ success: true, data: staff.toJSON() });
  } catch (error) { next(error); }
};

// Admin: Update staff member
const updateStaff = async (req, res, next) => {
  try {
    const { name, role, phone, permissions, isActive } = req.body;
    const staff = await User.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.restaurantId },
      { name, role, phone, permissions, isActive },
      { new: true, runValidators: true }
    );
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });
    res.json({ success: true, data: staff.toJSON() });
  } catch (error) { next(error); }
};

// Admin: Delete (deactivate) staff member
const deleteStaff = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
    }
    const staff = await User.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.restaurantId },
      { isActive: false },
      { new: true }
    );
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });
    res.json({ success: true, message: 'Staff member deactivated' });
  } catch (error) { next(error); }
};

// Admin: Reset staff password
const resetStaffPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const staff = await User.findOne({ _id: req.params.id, restaurant: req.restaurantId });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });
    staff.password = newPassword;
    await staff.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) { next(error); }
};

// Admin: Update restaurant settings
const updateRestaurantSettings = async (req, res, next) => {
  try {
    const Restaurant = require('../models/Restaurant');
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.restaurantId,
      req.body,
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: restaurant });
  } catch (error) { next(error); }
};

module.exports = { getStaff, createStaff, updateStaff, deleteStaff, resetStaffPassword, updateRestaurantSettings };
