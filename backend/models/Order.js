const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  foodType: { type: String },
  image: { type: String },
  specialInstructions: { type: String },
  subtotal: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  tableSession: { type: mongoose.Schema.Types.ObjectId, ref: 'TableSession', required: true },
  orderNumber: { type: String, required: true },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['pending_approval', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'rejected'],
    default: 'pending_approval'
  },
  subtotal: { type: Number, required: true },
  gstAmount: { type: Number, default: 0 },
  serviceCharge: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  specialInstructions: { type: String },
  rejectionReason: { type: String },
  confirmedAt: { type: Date },
  preparingAt: { type: Date },
  readyAt: { type: Date },
  servedAt: { type: Date },
  completedAt: { type: Date },
  rejectedAt: { type: Date },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

orderSchema.index({ restaurant: 1, tableSession: 1 });
orderSchema.index({ restaurant: 1, status: 1 });
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1, restaurant: 1 }, { unique: true });

module.exports = mongoose.model('Order', orderSchema);
