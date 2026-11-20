const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const tableSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  tableNumber: { type: String, required: true },
  displayName: { type: String },
  capacity: { type: Number, default: 4 },
  qrToken: { type: String, unique: true, default: () => uuidv4() },
  qrCodeUrl: { type: String },
  status: {
    type: String,
    enum: ['available', 'occupied', 'waiting_payment', 'cleaning'],
    default: 'available'
  },
  floor: { type: String, default: 'Ground' },
  section: { type: String },
  isActive: { type: Boolean, default: true },
  currentSession: { type: mongoose.Schema.Types.ObjectId, ref: 'TableSession', default: null },
}, { timestamps: true });

tableSchema.index({ restaurant: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);
