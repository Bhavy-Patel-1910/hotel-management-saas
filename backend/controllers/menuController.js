const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ restaurant: req.restaurantId, isActive: true }).sort('sortOrder');
    res.json({ success: true, data: categories });
  } catch (error) { next(error); }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, sortOrder } = req.body;
    const category = await Category.create({ restaurant: req.restaurantId, name, description, sortOrder });
    res.status(201).json({ success: true, data: category });
  } catch (error) { next(error); }
};

const updateCategory = async (req, res, next) => {
  try {
    const { name, description, sortOrder, isActive } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.restaurantId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: category });
  } catch (error) { next(error); }
};

const deleteCategory = async (req, res, next) => {
  try {
    const itemCount = await MenuItem.countDocuments({ category: req.params.id, restaurant: req.restaurantId });
    if (itemCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete category with ${itemCount} menu items` });
    }
    await Category.findOneAndDelete({ _id: req.params.id, restaurant: req.restaurantId });
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) { next(error); }
};

// Menu Items
const getMenuItems = async (req, res, next) => {
  try {
    const filter = { restaurant: req.restaurantId };
    // FIX: Validate category as a valid ObjectId to prevent NoSQL injection
    if (req.query.category && mongoose.Types.ObjectId.isValid(req.query.category)) {
      filter.category = req.query.category;
    }
    if (req.query.isAvailable !== undefined) filter.isAvailable = req.query.isAvailable === 'true';
    // FIX: Whitelist foodType values to prevent query injection
    const VALID_FOOD_TYPES = ['veg', 'non-veg', 'vegan', 'egg'];
    if (req.query.foodType && VALID_FOOD_TYPES.includes(req.query.foodType)) {
      filter.foodType = req.query.foodType;
    }

    let query = MenuItem.find(filter).populate('category', 'name sortOrder');

    if (req.query.search) {
      query = MenuItem.find({ ...filter, $text: { $search: req.query.search } }).populate('category', 'name sortOrder');
    }

    const items = await query.sort('sortOrder');
    res.json({ success: true, data: items });
  } catch (error) { next(error); }
};

const createMenuItem = async (req, res, next) => {
  try {
    const itemData = { ...req.body, restaurant: req.restaurantId };
    if (req.file) {
      itemData.image = `/uploads/${req.file.filename}`;
    }
    const item = await MenuItem.create(itemData);
    const populated = await item.populate('category', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

const updateMenuItem = async (req, res, next) => {
  try {
    const { name, description, price, category, foodType, isAvailable, preparationTime, tags, sortOrder, isSpecial, spiceLevel, servingSize, calories } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (category !== undefined) updateData.category = category;
    if (foodType !== undefined) updateData.foodType = foodType;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (preparationTime !== undefined) updateData.preparationTime = preparationTime;
    if (tags !== undefined) updateData.tags = tags;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isSpecial !== undefined) updateData.isSpecial = isSpecial;
    if (spiceLevel !== undefined) updateData.spiceLevel = spiceLevel;
    if (servingSize !== undefined) updateData.servingSize = servingSize;
    if (calories !== undefined) updateData.calories = calories;
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
      // Delete old image
      const oldItem = await MenuItem.findById(req.params.id);
      if (oldItem && oldItem.image && oldItem.image.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', oldItem.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }
    const item = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.restaurantId },
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name');
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findOneAndDelete({ _id: req.params.id, restaurant: req.restaurantId });
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });
    if (item.image && item.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '..', item.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error) { next(error); }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory, getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem };
