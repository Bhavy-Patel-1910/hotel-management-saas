const express = require('express');
const router = express.Router();
const {
  getCategories, createCategory, updateCategory, deleteCategory,
  getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem,
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');

// Public routes for customer ordering portal
router.get('/public/:restaurantId/categories', async (req, res, next) => {
  try {
    const cats = await Category.find({ restaurant: req.params.restaurantId, isActive: true }).sort('sortOrder');
    res.json({ success: true, data: cats });
  } catch (e) { next(e); }
});

router.get('/public/:restaurantId/items', async (req, res, next) => {
  try {
    const filter = { restaurant: req.params.restaurantId, isAvailable: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.foodType) filter.foodType = req.query.foodType;
    let items;
    if (req.query.search) {
      // Escape special regex characters to prevent ReDoS / injection
      const escapedSearch = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      items = await MenuItem.find({ ...filter, name: { $regex: escapedSearch, $options: 'i' } })
        .populate('category', 'name sortOrder')
        .sort('sortOrder');
    } else {
      items = await MenuItem.find(filter)
        .populate('category', 'name sortOrder')
        .sort('sortOrder');
    }
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
});

// Protected routes (Admin / Staff)
router.get('/categories', protect, getCategories);
router.post('/categories', protect, authorize('admin', 'manager'), createCategory);
router.put('/categories/:id', protect, authorize('admin', 'manager'), updateCategory);
router.delete('/categories/:id', protect, authorize('admin', 'manager'), deleteCategory);

router.get('/items', protect, getMenuItems);
router.post('/items', protect, authorize('admin', 'manager'), upload.single('image'), createMenuItem);
router.put('/items/:id', protect, authorize('admin', 'manager'), upload.single('image'), updateMenuItem);
router.delete('/items/:id', protect, authorize('admin', 'manager'), deleteMenuItem);

module.exports = router;
