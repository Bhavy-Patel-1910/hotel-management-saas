const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
      }
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
    }
    const user = await User.findById(decoded.id).populate('restaurant');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }
    req.user = user;
    req.restaurantId = user.restaurant._id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Role ${req.user.role} is not authorized` });
    }
    next();
  };
};

const tenantIsolation = (req, res, next) => {
  if (req.params.restaurantId && req.params.restaurantId !== req.restaurantId.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied to this restaurant data' });
  }
  next();
};

module.exports = { protect, authorize, tenantIsolation };
