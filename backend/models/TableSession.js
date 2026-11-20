const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const tableSessionSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  sessionToken: { type: String, unique: true, default: () => uuidv4() },
  status: {
    type: String,
    enum: ['active', 'payment_pending', 'completed', 'abandoned'],
    default: 'active'
  },
  guestCount: { type: Number, default: 1 },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  notes: { type: String },
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
}, { timestamps: true });

tableSessionSchema.index({ restaurant: 1, table: 1, status: 1 });
tableSessionSchema.index({ restaurant: 1, status: 1 });

module.exports = mongoose.model('TableSession', tableSessionSchema);
