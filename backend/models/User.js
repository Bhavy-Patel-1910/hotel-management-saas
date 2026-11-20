const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'manager', 'waiter', 'kitchen'], default: 'waiter' },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  permissions: {
    manageMenu: { type: Boolean, default: false },
    manageTables: { type: Boolean, default: false },
    manageOrders: { type: Boolean, default: true },
    viewReports: { type: Boolean, default: false },
    manageStaff: { type: Boolean, default: false },
    managePayments: { type: Boolean, default: false },
  },
}, { timestamps: true });

userSchema.index({ restaurant: 1, email: 1 }, { unique: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
