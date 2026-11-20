const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  image: { type: String },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

categorySchema.index({ restaurant: 1, name: 1 }, { unique: true });
categorySchema.index({ restaurant: 1, sortOrder: 1 });
categorySchema.index({ restaurant: 1, isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);

