const Payment = require('../models/Payment');
const Order = require('../models/Order');
const TableSession = require('../models/TableSession');
const Table = require('../models/Table');
const Restaurant = require('../models/Restaurant');
const { generateBillNumber } = require('../utils/generateOrderNumber');
const crypto = require('crypto');

let Razorpay;
try {
  Razorpay = require('razorpay');
} catch (e) {
  console.log('Razorpay not configured');
}

// Public: Create Razorpay order
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { sessionToken } = req.body;
    const session = await TableSession.findOne({ sessionToken, status: 'active' }).populate('restaurant');
    if (!session) return res.status(404).json({ success: false, message: 'Invalid session' });

    const orders = await Order.find({
      tableSession: session._id,
      status: { $in: ['confirmed', 'preparing', 'ready', 'served', 'completed'] }
    });

    if (orders.length === 0) {
      return res.status(400).json({ success: false, message: 'No confirmed orders to pay for' });
    }

    // Check existing payment
    const existingPayment = await Payment.findOne({ tableSession: session._id, paymentStatus: { $in: ['pending', 'paid'] } });
    if (existingPayment && existingPayment.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Bill already paid' });
    }

    const subtotal = orders.reduce((sum, o) => sum + o.subtotal, 0);
    const gstAmount = orders.reduce((sum, o) => sum + o.gstAmount, 0);
    const serviceCharge = orders.reduce((sum, o) => sum + o.serviceCharge, 0);
    const totalAmount = subtotal + gstAmount + serviceCharge;
    const totalPaise = Math.round(totalAmount * 100);

    if (!Razorpay || !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ success: false, message: 'Online payment not configured. Please pay at counter.' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: totalPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    const billNumber = await generateBillNumber(session.restaurant._id);
    const payment = await Payment.create({
      restaurant: session.restaurant._id,
      tableSession: session._id,
      orders: orders.map(o => o._id),
      billNumber,
      subtotal,
      gstAmount,
      serviceCharge,
      totalAmount,
      paymentMethod: 'online',
      paymentStatus: 'pending',
      razorpayOrderId: razorpayOrder.id,
    });

    res.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: totalPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        payment: payment._id,
        restaurantName: session.restaurant.name,
        billNumber,
      },
    });
  } catch (error) { next(error); }
};

// Public: Verify Razorpay payment
const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !paymentId) {
      return res.status(400).json({ success: false, message: 'All payment verification parameters are required' });
    }

    const payment = await Payment.findById(paymentId).populate('tableSession');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    if (payment.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Bill has already been paid' });
    }

    // Security binding check: ensure razorpay_order_id matches the order generated for this specific bill
    if (payment.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: 'Payment order ID does not match this bill' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const sigBuffer = Buffer.from(razorpay_signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      payment.paymentStatus = 'failed';
      await payment.save();
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    payment.paymentStatus = 'paid';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paidAt = new Date();
    payment.paidAmount = payment.totalAmount;
    await payment.save();

    // Update session
    if (payment.tableSession) {
      await TableSession.findByIdAndUpdate(payment.tableSession._id, { status: 'payment_pending', paidAmount: payment.totalAmount });
      await Table.findOneAndUpdate({ currentSession: payment.tableSession._id }, { status: 'waiting_payment' });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`restaurant-${payment.restaurant}`).emit('payment-received', { payment });
      if (payment.tableSession) {
        io.to(`session-${payment.tableSession._id}`).emit('payment-success', { payment });
      }
    }

    res.json({ success: true, message: 'Payment successful', data: payment });
  } catch (error) { next(error); }
};

// Public: Get bill for session
const getSessionBill = async (req, res, next) => {
  try {
    const { sessionToken } = req.params;
    // FIX: Populate only safe restaurant fields — prevents leaking email, gstNumber, etc.
    const session = await TableSession.findOne({ sessionToken })
      .populate('table', 'tableNumber displayName')
      .populate('restaurant', 'name logo gstPercentage serviceCharge currency currencySymbol settings');
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const orders = await Order.find({
      tableSession: session._id,
      status: { $nin: ['rejected'] }
    }).sort('createdAt');

    if (orders.length === 0 && (session.status === 'completed' || session.status === 'abandoned')) {
      return res.json({ success: true, data: { session, orders: [], payment: null, restaurant: session.restaurant, table: session.table }, message: 'This session has ended and has no orders.' });
    }

    const payment = await Payment.findOne({ tableSession: session._id }).sort('-createdAt');

    res.json({ success: true, data: { session, orders, payment, restaurant: session.restaurant, table: session.table } });
  } catch (error) { next(error); }
};

// Admin: Mark payment as cash received
const markCashPayment = async (req, res, next) => {
  try {
    const { tableSessionId } = req.params;
    const session = await TableSession.findOne({ _id: tableSessionId, restaurant: req.restaurantId });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const orders = await Order.find({ tableSession: session._id, status: { $nin: ['rejected'] } });
    const subtotal = orders.reduce((sum, o) => sum + o.subtotal, 0);
    const gstAmount = orders.reduce((sum, o) => sum + o.gstAmount, 0);
    const serviceCharge = orders.reduce((sum, o) => sum + o.serviceCharge, 0);
    const totalAmount = subtotal + gstAmount + serviceCharge;

    let payment = await Payment.findOne({ tableSession: session._id });
    if (payment && payment.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Already paid' });
    }

    const billNumber = payment ? payment.billNumber : await generateBillNumber(req.restaurantId);
    payment = await Payment.findOneAndUpdate(
      { tableSession: session._id },
      {
        restaurant: req.restaurantId,
        tableSession: session._id,
        orders: orders.map(o => o._id),
        billNumber,
        subtotal,
        gstAmount,
        serviceCharge,
        totalAmount,
        paidAmount: totalAmount,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        paidAt: new Date(),
        markedPaidBy: req.user._id,
      },
      { upsert: true, new: true }
    );

    await TableSession.findByIdAndUpdate(session._id, { status: 'completed', completedAt: new Date(), paidAmount: totalAmount });
    await Table.findOneAndUpdate({ currentSession: session._id }, { status: 'cleaning', currentSession: null });

    const io = req.app.get('io');
    if (io) {
      io.to(`restaurant-${req.restaurantId}`).emit('payment-received', { payment });
      io.to(`session-${session._id}`).emit('payment-success', { payment });
    }

    res.json({ success: true, data: payment, message: 'Cash payment recorded' });
  } catch (error) { next(error); }
};

// Admin: Get all payments/bills
const getPayments = async (req, res, next) => {
  try {
    const filter = { restaurant: req.restaurantId };
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.billNumber) filter.billNumber = { $regex: req.query.billNumber, $options: 'i' };
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const [payments, total] = await Promise.all([
      Payment.find(filter).populate('tableSession', 'table').populate('markedPaidBy', 'name').sort('-createdAt').skip((page - 1) * limit).limit(limit),
      Payment.countDocuments(filter),
    ]);
    res.json({ success: true, data: payments, pagination: { page, limit, total } });
  } catch (error) { next(error); }
};

// Admin: Get revenue stats
const getRevenueStats = async (req, res, next) => {
  try {
    const restaurantId = req.restaurantId;
    const now = new Date();

    // Today
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    // Yesterday
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayEnd); yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

    // This week (Mon-Sun)
    const thisWeekStart = new Date(todayStart);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay() + (thisWeekStart.getDay() === 0 ? -6 : 1));

    // This month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // This year
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    const getRevenue = async (start, end) => {
      const result = await Payment.aggregate([
        { $match: { restaurant: restaurantId, paymentStatus: 'paid', paidAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$refundAmount'] } }, count: { $sum: 1 } } }
      ]);
      return result[0] || { total: 0, count: 0 };
    };

    const [today, yesterday, thisWeek, thisMonth, thisYear, lifetime] = await Promise.all([
      getRevenue(todayStart, todayEnd),
      getRevenue(yesterdayStart, yesterdayEnd),
      getRevenue(thisWeekStart, todayEnd),
      getRevenue(thisMonthStart, todayEnd),
      getRevenue(thisYearStart, todayEnd),
      getRevenue(new Date(0), todayEnd),
    ]);

    // Daily revenue for last 30 days
    const last30Days = await Payment.aggregate([
      { $match: { restaurant: restaurantId, paymentStatus: 'paid', paidAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } }, revenue: { $sum: { $subtract: ['$totalAmount', '$refundAmount'] } }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Monthly revenue for current year
    const monthlyRevenue = await Payment.aggregate([
      { $match: { restaurant: restaurantId, paymentStatus: 'paid', paidAt: { $gte: thisYearStart } } },
      { $group: { _id: { month: { $month: '$paidAt' } }, revenue: { $sum: { $subtract: ['$totalAmount', '$refundAmount'] } }, orders: { $sum: 1 } } },
      { $sort: { '_id.month': 1 } }
    ]);

    // Yearly revenue
    const yearlyRevenue = await Payment.aggregate([
      { $match: { restaurant: restaurantId, paymentStatus: 'paid' } },
      { $group: { _id: { year: { $year: '$paidAt' } }, revenue: { $sum: { $subtract: ['$totalAmount', '$refundAmount'] } }, orders: { $sum: 1 } } },
      { $sort: { '_id.year': 1 } }
    ]);

    // Top selling items
    const topItems = await Order.aggregate([
      { $match: { restaurant: restaurantId, status: { $in: ['completed', 'served'] }, createdAt: { $gte: thisMonthStart } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.menuItem', name: { $first: '$items.name' }, totalQty: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.subtotal' } } },
      { $sort: { totalQty: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          today: today.total || 0,
          yesterday: yesterday.total || 0,
          thisWeek: thisWeek.total || 0,
          thisMonth: thisMonth.total || 0,
          thisYear: thisYear.total || 0,
          lifetime: lifetime.total || 0,
        },
        orderCounts: {
          today: today.count || 0,
          yesterday: yesterday.count || 0,
          thisWeek: thisWeek.count || 0,
          thisMonth: thisMonth.count || 0,
          thisYear: thisYear.count || 0,
          lifetime: lifetime.count || 0,
        },
        charts: { last30Days, monthlyRevenue, yearlyRevenue },
        topItems,
      },
    });
  } catch (error) { next(error); }
};

// Admin: Razorpay webhook
const razorpayWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    
    // Support Buffer from express.raw() or parsed string
    const rawPayload = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawPayload)
      .digest('hex');

    const sigBuffer = Buffer.from(signature || '', 'hex');
    const expBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const eventData = JSON.parse(rawPayload);
    const event = eventData.event;
    if (event === 'payment.captured') {
      const paymentEntity = eventData.payload?.payment?.entity;
      if (paymentEntity?.order_id) {
        await Payment.findOneAndUpdate(
          { razorpayOrderId: paymentEntity.order_id },
          { paymentStatus: 'paid', razorpayPaymentId: paymentEntity.id, paidAt: new Date() }
        );
      }
    }

    res.json({ success: true });
  } catch (error) { next(error); }
};

module.exports = { createRazorpayOrder, verifyRazorpayPayment, getSessionBill, markCashPayment, getPayments, getRevenueStats, razorpayWebhook };
