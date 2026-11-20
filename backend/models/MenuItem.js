const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  image: { type: String },
  foodType: { type: String, enum: ['veg', 'non-veg', 'vegan', 'egg'], default: 'veg' },
  isAvailable: { type: Boolean, default: true },
  preparationTime: { type: Number, default: 15 }, // minutes
  tags: [{ type: String }],
  sortOrder: { type: Number, default: 0 },
  isSpecial: { type: Boolean, default: false },
  spiceLevel: { type: String, enum: ['mild', 'medium', 'hot', 'extra-hot'], default: 'medium' },
  servingSize: { type: String },
  calories: { type: Number },
}, { timestamps: true });

menuItemSchema.index({ restaurant: 1, category: 1 });
menuItemSchema.index({ restaurant: 1, isAvailable: 1 });
menuItemSchema.index({ restaurant: 1, name: 'text', description: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);
