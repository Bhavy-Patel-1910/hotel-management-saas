const jwt = require('jsonwebtoken');
const User = require('../models/User');

const initializeSockets = (io) => {
  // Optional auth middleware for admin sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          socket.user = user;
          socket.restaurantId = user.restaurant.toString();
        }
      }
      next();
    } catch (err) {
      // Allow unauthenticated for public table customer connections
      next();
    }
  });

  io.on('connection', (socket) => {
    // Admin / Staff join restaurant channel
    // FIX: Verify socket is authenticated and belongs to the requested restaurant
    socket.on('join-restaurant', (restaurantId) => {
      if (socket.restaurantId && socket.restaurantId === restaurantId.toString()) {
        socket.join(`restaurant-${restaurantId}`);
      }
      // Silently reject unauthenticated or mismatched requests
    });

    // Customer joins active table session channel
    socket.on('join-session', (sessionId) => {
      const roomId = `session-${sessionId}`;
      socket.join(roomId);
    });

    // Customer joins table channel
    socket.on('join-table', (tableId) => {
      const roomId = `table-${tableId}`;
      socket.join(roomId);
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
};

module.exports = initializeSockets;
