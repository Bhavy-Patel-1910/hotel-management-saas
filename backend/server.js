const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '.env') });

// FIX: Validate required environment variables at startup — fail fast with a clear message
const REQUIRED_ENV = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missingEnv.join(', ')}`);
  console.error('Please check your .env file.');
  process.exit(1);
}

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const initializeSockets = require('./sockets/index');

const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const tableRoutes = require('./routes/tableRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB().catch(err => {
  console.log('MongoDB will retry on queries or startup.');
});

// Create uploads folder if not exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Socket.io initialization with CORS
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

initializeSockets(io);
app.set('io', io);

// Security Headers with relaxed crossOriginResourcePolicy for served uploads
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));

// Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiters
// High-capacity limiter for public dining endpoints (menu browsing, table polling on shared hotel Wi-Fi)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this network. Please wait a moment.' },
});
app.use('/api/', apiLimiter);

// Dedicated strict brute-force limiter for login endpoint
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);

// Body Parsers (Raw body parser for webhook is handled in paymentRoutes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/restaurant', restaurantRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Smart Restaurant & Hotel SaaS API',
    version: '1.0.0',
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Smart Restaurant SaaS Backend Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time table & order events`);
});

module.exports = { app, server };
