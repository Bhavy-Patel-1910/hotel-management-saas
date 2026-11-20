const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  logo: { type: String, default: null },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  gstNumber: { type: String },
  gstPercentage: { type: Number, default: 5 },
  serviceCharge: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  currencySymbol: { type: String, default: '₹' },
  openingTime: { type: String, default: '08:00' },
  closingTime: { type: String, default: '23:00' },
  isActive: { type: Boolean, default: true },
  subscriptionPlan: { type: String, enum: ['trial', 'basic', 'pro', 'enterprise'], default: 'trial' },
  subscriptionExpiry: { type: Date },
  settings: {
    allowCashPayment: { type: Boolean, default: true },
    allowOnlinePayment: { type: Boolean, default: true },
    requireOrderApproval: { type: Boolean, default: true },
    tableSessionTimeout: { type: Number, default: 180 }, // minutes
  },
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);
