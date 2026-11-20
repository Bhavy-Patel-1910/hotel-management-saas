const Table = require('../models/Table');
const TableSession = require('../models/TableSession');
const Order = require('../models/Order');
const { generateQRCode } = require('../utils/generateQR');
const { v4: uuidv4 } = require('uuid');

const getTables = async (req, res, next) => {
  try {
    const tables = await Table.find({ restaurant: req.restaurantId, isActive: true })
      .populate('currentSession')
      .sort('tableNumber');
    res.json({ success: true, data: tables });
  } catch (error) { next(error); }
};

const createTable = async (req, res, next) => {
  try {
    const { tableNumber, displayName, capacity, floor, section } = req.body;
    const table = await Table.create({
      restaurant: req.restaurantId,
      tableNumber,
      displayName: displayName || `Table ${tableNumber}`,
      capacity,
      floor,
      section,
    });
    const qrUrl = `${process.env.FRONTEND_URL}/menu?table=${table.qrToken}`;
    const qrCode = await generateQRCode(qrUrl);
    table.qrCodeUrl = qrCode;
    await table.save();
    res.status(201).json({ success: true, data: table });
  } catch (error) { next(error); }
};

const updateTable = async (req, res, next) => {
  try {
    const { displayName, capacity, floor, section, status } = req.body;
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (floor !== undefined) updateData.floor = floor;
    if (section !== undefined) updateData.section = section;
    if (status !== undefined) updateData.status = status;

    const table = await Table.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.restaurantId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    res.json({ success: true, data: table });
  } catch (error) { next(error); }
};

const deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findOneAndDelete({
      _id: req.params.id,
      restaurant: req.restaurantId
    });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    res.json({ success: true, message: 'Table deleted' });
  } catch (error) { next(error); }
};

const regenerateQR = async (req, res, next) => {
  try {
    const table = await Table.findOne({ _id: req.params.id, restaurant: req.restaurantId });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    table.qrToken = uuidv4();
    const qrUrl = `${process.env.FRONTEND_URL}/menu?table=${table.qrToken}`;
    table.qrCodeUrl = await generateQRCode(qrUrl);
    await table.save();
    res.json({ success: true, data: table });
  } catch (error) { next(error); }
};

// Public: Get table info by QR token
const getTableByToken = async (req, res, next) => {
  try {
    const table = await Table.findOne({ qrToken: req.params.token, isActive: true }).populate('restaurant');
    if (!table) return res.status(404).json({ success: false, message: 'Invalid QR code' });

    // Find active session
    let session = await TableSession.findOne({ table: table._id, status: 'active' });

    if (!session) {
      // Create a new session
      session = await TableSession.create({
        restaurant: table.restaurant._id,
        table: table._id,
      });
      await Table.findByIdAndUpdate(table._id, { status: 'occupied', currentSession: session._id });
    }

    // Get session orders
    const orders = await Order.find({ tableSession: session._id }).populate('items.menuItem', 'name image');

    res.json({
      success: true,
      data: {
        restaurant: {
          _id: table.restaurant._id,
          name: table.restaurant.name,
          logo: table.restaurant.logo,
          gstPercentage: table.restaurant.gstPercentage,
          serviceCharge: table.restaurant.serviceCharge,
          currency: table.restaurant.currency,
          currencySymbol: table.restaurant.currencySymbol,
          settings: table.restaurant.settings,
        },
        table: {
          _id: table._id,
          tableNumber: table.tableNumber,
          displayName: table.displayName,
        },
        session: {
          _id: session._id,
          sessionToken: session.sessionToken,
          status: session.status,
        },
        orders,
      },
    });
  } catch (error) { next(error); }
};

module.exports = { getTables, createTable, updateTable, deleteTable, regenerateQR, getTableByToken };
