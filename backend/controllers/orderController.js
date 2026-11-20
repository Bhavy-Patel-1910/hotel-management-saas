const Order = require('../models/Order');
const TableSession = require('../models/TableSession');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const { generateOrderNumber } = require('../utils/generateOrderNumber');

// Public: Place order from customer portal
const placeOrder = async (req, res, next) => {
  try {
    const { sessionToken, items, specialInstructions } = req.body;

    if (!sessionToken) {
      return res.status(400).json({ success: false, message: 'Active sessionToken is required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart cannot be empty. Please select at least one item.' });
    }

    // Validate quantities before database calls
    for (const item of items) {
      if (!item || !item.menuItemId || typeof item.quantity !== 'number' || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for item "${item?.name || 'dish'}". Quantity must be a positive whole number (minimum 1).`
        });
      }
    }

    const session = await TableSession.findOne({ sessionToken, status: 'active' }).populate('restaurant table');
    if (!session) return res.status(404).json({ success: false, message: 'Invalid or expired session' });

    const restaurant = session.restaurant;

    // Validate and build order items
    const orderItems = [];
    let subtotal = 0;
    for (const item of items) {

      let menuItem;
      try {
        menuItem = await MenuItem.findOne({
          _id: item.menuItemId,
          restaurant: restaurant._id,
          isAvailable: true,
        });
      } catch (castErr) {
        return res.status(400).json({ success: false, message: `Invalid item ID for "${item.name || 'dish'}"` });
      }

      if (!menuItem) {
        return res.status(400).json({ success: false, message: `Item "${item.name || 'dish'}" is not available` });
      }
      const itemSubtotal = menuItem.price * item.quantity;
      subtotal += itemSubtotal;
      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        foodType: menuItem.foodType,
        image: menuItem.image,
        specialInstructions: (item.specialInstructions || '').slice(0, 300),
        subtotal: itemSubtotal,
      });
    }

    const gstAmount = (subtotal * restaurant.gstPercentage) / 100;
    const serviceChargeAmount = (subtotal * restaurant.serviceCharge) / 100;
    const totalAmount = subtotal + gstAmount + serviceChargeAmount;

    const orderNumber = await generateOrderNumber(restaurant._id);

    const order = await Order.create({
      restaurant: restaurant._id,
      table: session.table._id,
      tableSession: session._id,
      orderNumber,
      items: orderItems,
      status: restaurant.settings.requireOrderApproval ? 'pending_approval' : 'confirmed',
      subtotal,
      gstAmount,
      serviceCharge: serviceChargeAmount,
      totalAmount,
      specialInstructions,
    });

    // Update session total
    await TableSession.findByIdAndUpdate(session._id, {
      $inc: { totalAmount: totalAmount }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`restaurant-${restaurant._id}`).emit('new-order', {
        order: {
          ...order.toObject(),
          table: { tableNumber: session.table.tableNumber, displayName: session.table.displayName },
        },
      });
    }

    res.status(201).json({ success: true, data: order, message: 'Order placed successfully' });
  } catch (error) { next(error); }
};

// Public: Get session orders
const getSessionOrders = async (req, res, next) => {
  try {
    const { sessionToken } = req.params;
    const session = await TableSession.findOne({ sessionToken });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    const orders = await Order.find({ tableSession: session._id }).sort('-createdAt');
    res.json({ success: true, data: orders, session });
  } catch (error) { next(error); }
};

// Admin: Get all orders
const getOrders = async (req, res, next) => {
  try {
    const filter = { restaurant: req.restaurantId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.tableSession) filter.tableSession = req.query.tableSession;
    if (req.query.date) {
      const date = new Date(req.query.date);
      filter.createdAt = { $gte: new Date(date.setHours(0, 0, 0, 0)), $lt: new Date(date.setHours(23, 59, 59, 999)) };
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter).populate('table', 'tableNumber displayName').populate('confirmedBy', 'name').sort('-createdAt').skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);
    res.json({ success: true, data: orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

// Admin: Update order status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    // FIX: Validate status against allowed enum before any DB operation
    const VALID_STATUSES = ['confirmed', 'preparing', 'ready', 'served', 'completed', 'rejected'];
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const order = await Order.findOne({ _id: req.params.id, restaurant: req.restaurantId }).populate('table', 'tableNumber displayName');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const now = new Date();
    const updateData = { status };
    if (status === 'confirmed') { updateData.confirmedAt = now; updateData.confirmedBy = req.user._id; }
    if (status === 'preparing') updateData.preparingAt = now;
    if (status === 'ready') updateData.readyAt = now;
    if (status === 'served') updateData.servedAt = now;
    if (status === 'completed') updateData.completedAt = now;
    if (status === 'rejected') { updateData.rejectedAt = now; updateData.rejectionReason = rejectionReason; }

    Object.assign(order, updateData);
    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`restaurant-${req.restaurantId}`).emit('order-updated', { order });
      io.to(`session-${order.tableSession}`).emit('order-status-updated', {
        orderId: order._id,
        status: order.status,
        order,
      });

      if (order.table) {
        const tableId = order.table._id ? order.table._id.toString() : order.table.toString();
        io.to(`table-${tableId}`).emit('order-status-updated', {
          orderId: order._id,
          status: order.status,
          order,
        });
        io.to(`table-${tableId}`).emit('order-updated', { order });
      }
    }

    res.json({ success: true, data: order });
  } catch (error) { next(error); }
};

// Admin: Get order stats for dashboard
const getOrderStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalOrdersToday,
      pendingOrders,
      completedOrdersToday,
      activeTablesCount,
    ] = await Promise.all([
      Order.countDocuments({ restaurant: req.restaurantId, createdAt: { $gte: today, $lte: todayEnd } }),
      Order.countDocuments({ restaurant: req.restaurantId, status: { $in: ['pending_approval', 'confirmed', 'preparing', 'ready'] } }),
      Order.countDocuments({ restaurant: req.restaurantId, status: 'completed', createdAt: { $gte: today, $lte: todayEnd } }),
      TableSession.countDocuments({ restaurant: req.restaurantId, status: 'active' }),
    ]);

    res.json({ success: true, data: { totalOrdersToday, pendingOrders, completedOrdersToday, activeTablesCount } });
  } catch (error) { next(error); }
};

module.exports = { placeOrder, getSessionOrders, getOrders, updateOrderStatus, getOrderStats };
