const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');
const Table = require('../models/Table');
const { generateQRCode } = require('../utils/generateQR');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// @desc Register new restaurant + admin
// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { restaurantName, email, password, name, phone, address } = req.body;

    const existingRestaurant = await Restaurant.findOne({ email });
    if (existingRestaurant) {
      return res.status(400).json({ success: false, message: 'Restaurant with this email already exists' });
    }

    const slug = restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Date.now();

    const restaurant = await Restaurant.create({
      name: restaurantName,
      slug,
      email,
      phone,
      address,
    });

    const admin = await User.create({
      restaurant: restaurant._id,
      name,
      email,
      password,
      role: 'admin',
      permissions: {
        manageMenu: true,
        manageTables: true,
        manageOrders: true,
        viewReports: true,
        manageStaff: true,
        managePayments: true,
      },
    });

    // Create default categories
    const defaultCategories = [
      { name: 'Starters', sortOrder: 1 },
      { name: 'Main Course', sortOrder: 2 },
      { name: 'Chinese', sortOrder: 3 },
      { name: 'Punjabi', sortOrder: 4 },
      { name: 'South Indian', sortOrder: 5 },
      { name: 'Fast Food', sortOrder: 6 },
      { name: 'Beverages', sortOrder: 7 },
      { name: 'Desserts', sortOrder: 8 },
    ];

    await Category.insertMany(defaultCategories.map(c => ({ ...c, restaurant: restaurant._id })));

    // Create default tables with QR codes
    for (let i = 1; i <= 4; i++) {
      const table = await Table.create({
        restaurant: restaurant._id,
        tableNumber: String(i).padStart(2, '0'),
        displayName: `Table ${String(i).padStart(2, '0')}`,
        capacity: 4,
      });
      const qrUrl = `${process.env.FRONTEND_URL}/menu?table=${table.qrToken}`;
      const qrCode = await generateQRCode(qrUrl);
      await Table.findByIdAndUpdate(table._id, { qrCodeUrl: qrCode });
    }

    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      token,
      user: admin.toJSON(),
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Login admin/staff
// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate('restaurant');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: user.toJSON(),
      restaurant: user.restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get current user
// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toJSON(), restaurant: req.user.restaurant });
};

// @desc Change password
// @route PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, changePassword };
