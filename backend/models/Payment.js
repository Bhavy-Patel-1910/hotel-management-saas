const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  tableSession: { type: mongoose.Schema.Types.ObjectId, ref: 'TableSession', required: true },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  billNumber: { type: String, required: true, unique: true },
  subtotal: { type: Number, required: true },
  gstAmount: { type: Number, default: 0 },
  serviceCharge: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['cash', 'upi', 'card', 'online', 'mixed'], default: 'cash' },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'pending', 'paid', 'failed', 'refunded', 'partial'],
    default: 'unpaid'
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  transactionId: { type: String },
  paidAt: { type: Date },
  markedPaidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  refundAmount: { type: Number, default: 0 },
  refundedAt: { type: Date },
  refundReason: { type: String },
}, { timestamps: true });

paymentSchema.index({ restaurant: 1, paymentStatus: 1 });
paymentSchema.index({ restaurant: 1, createdAt: -1 });
paymentSchema.index({ restaurant: 1, paidAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
