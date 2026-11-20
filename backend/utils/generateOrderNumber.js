const Order = require('../models/Order');
const crypto = require('crypto');

const generateOrderNumber = async (restaurantId) => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const count = await Order.countDocuments({
    restaurant: restaurantId,
    createdAt: { $gte: todayStart }
  });

  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ORD-${dateStr}-${String(count + 1).padStart(3, '0')}-${suffix}`;
};

const generateBillNumber = async (restaurantId) => {
  const Payment = require('../models/Payment');
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Payment.countDocuments({ restaurant: restaurantId });
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `BILL-${dateStr}-${String(count + 1).padStart(4, '0')}-${suffix}`;
};

module.exports = { generateOrderNumber, generateBillNumber };
