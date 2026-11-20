# REMEDIATION & BUG FIXING BLUEPRINTS (PHASE 11 ROADMAP)
**Project:** Smart Restaurant & Hotel Management SaaS Portal  
**Target:** Production-Grade Hardening & Quality Engineering  
**Date:** November 19, 2026  

---

## 1. Prioritized Remediation Strategy

The remediation is ordered strictly by security severity and commercial impact:
1. **Tier 1 (CRITICAL - Immediate):**
   - Fix Payment Order ID verification decoupling in `paymentController.js` (BUG-01).
   - Fix Order Number race collision in `generateOrderNumber.js` (BUG-02).
2. **Tier 2 (HIGH - Same Release):**
   - Implement strict order input validation (empty cart, non-positive quantities) in `orderController.js` (BUG-03, BUG-04).
   - Fix Razorpay webhook HMAC verification buffer issue in `paymentController.js` (BUG-06).
   - Adjust global rate limiter for shared restaurant Wi-Fi in `server.js` (BUG-05).
3. **Tier 3 (MEDIUM - Next Minor):**
   - Whitelist table update fields against mass assignment in `tableController.js` (BUG-07).
   - Enforce global email uniqueness in `models/User.js` (BUG-08).
   - Restrict Multer file extensions and MIME inspection in `upload.js` (BUG-09).
4. **Tier 4 (LOW - Quality Polish):**
   - Timing-safe signature comparison, compound indexes, and password complexity.

---

## 2. Concrete Code-Level Blueprints

### Fix 1: Bind Razorpay Order ID to Target Payment (`paymentController.js`)
```javascript
// In verifyRazorpayPayment:
const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !paymentId) {
  return res.status(400).json({ success: false, message: 'All verification parameters are required' });
}

// 1. Fetch payment record first
const payment = await Payment.findById(paymentId).populate('tableSession');
if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

// 2. Prevent replay attacks
if (payment.paymentStatus === 'paid') {
  return res.status(400).json({ success: false, message: 'Bill has already been settled' });
}

// 3. CRITICAL: Enforce Razorpay Order ID matches the database record!
if (payment.razorpayOrderId !== razorpay_order_id) {
  return res.status(400).json({ success: false, message: 'Payment order ID mismatch with bill' });
}

// 4. Verify HMAC with timing-safe comparison
const body = razorpay_order_id + '|' + razorpay_payment_id;
const expectedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(body)
  .digest('hex');

const sigBuffer = Buffer.from(razorpay_signature, 'hex');
const expectedBuffer = Buffer.from(expectedSignature, 'hex');

if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
  payment.paymentStatus = 'failed';
  await payment.save();
  return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
}
```

---

### Fix 2: Atomic High-Entropy Order Number Generation (`generateOrderNumber.js`)
```javascript
const Order = require('../models/Order');
const crypto = require('crypto');

const generateOrderNumber = async (restaurantId) => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Count today's orders
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const count = await Order.countDocuments({
    restaurant: restaurantId,
    createdAt: { $gte: todayStart }
  });

  // Append a high-entropy 2-character random hex to guarantee uniqueness during concurrent milliseconds
  const entropy = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ORD-${dateStr}-${String(count + 1).padStart(3, '0')}-${entropy}`;
};
```

---

### Fix 3: Strict Cart & Item Quantity Validation (`orderController.js`)
```javascript
// At start of placeOrder:
const { sessionToken, items, specialInstructions } = req.body;

if (!sessionToken) {
  return res.status(400).json({ success: false, message: 'Active sessionToken is required' });
}

if (!Array.isArray(items) || items.length === 0) {
  return res.status(400).json({ success: false, message: 'Cart cannot be empty. Please select at least one item.' });
}

for (const item of items) {
  if (!item.menuItemId || !item.quantity || typeof item.quantity !== 'number' || item.quantity < 1 || !Number.isInteger(item.quantity)) {
    return res.status(400).json({
      success: false,
      message: `Invalid quantity for item "${item.name || 'dish'}". Quantity must be a positive whole number (min 1).`
    });
  }
}
```

---

### Fix 4: Razorpay Webhook Buffer Signature Fix (`paymentController.js`)
```javascript
const razorpayWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    
    // req.body is already a Buffer from express.raw({ type: 'application/json' })
    const rawPayload = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);

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
    if (eventData.event === 'payment.captured') {
      const paymentEntity = eventData.payload.payment.entity;
      await Payment.findOneAndUpdate(
        { razorpayOrderId: paymentEntity.order_id },
        { paymentStatus: 'paid', razorpayPaymentId: paymentEntity.id, paidAt: new Date() }
      );
    }

    res.json({ success: true });
  } catch (error) { next(error); }
};
```

---

### Fix 5: Hotel Wi-Fi Friendly Rate Limiting (`server.js`)
```javascript
// High-capacity limiter for public dining endpoints (menu browsing, table polling)
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // 10,000 requests per 15 min covers busy hotel dining rooms on shared Wi-Fi
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please wait a moment.' },
});
app.use('/api/', publicLimiter);

// Strict limiter specifically for sensitive authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // 15 attempts per 15 minutes prevents brute-force password guessing
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);
```

---

### Fix 6: Table Mass Assignment Whitelist (`tableController.js`)
```javascript
const updateTable = async (req, res, next) => {
  try {
    const { displayName, capacity, floor, section, status } = req.body;
    const table = await Table.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.restaurantId },
      { displayName, capacity, floor, section, status },
      { new: true, runValidators: true }
    );
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    res.json({ success: true, data: table });
  } catch (error) { next(error); }
};
```
