# BUGS, DEFECTS & VULNERABILITIES CATALOG
**Project:** Smart Restaurant & Hotel Management SaaS Portal  
**Total Issues Logged:** 15  
**Severity Breakdown:** 2 Critical, 4 High, 5 Medium, 4 Low  
**Date:** November 19, 2026  

---

### BUG-01: Razorpay Payment Verification Decoupling (Arbitrary Bill Bypass)
- **Severity:** **CRITICAL**
- **Category:** Financial Security / Broken Business Logic
- **Affected File:** `backend/controllers/paymentController.js` (lines 90-137)
- **Reproduction Steps:**
  1. Create a large banquet bill of ₹10,000 for Table 01 (`paymentId: "6afc..."`).
  2. Initiate a separate ₹1 order on Razorpay to obtain a legitimate `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
  3. Send `POST /api/payments/verify` with `{ razorpay_order_id: "<1_rupee_order_id>", razorpay_payment_id: "<1_rupee_payment_id>", razorpay_signature: "<valid_signature>", paymentId: "<10000_bill_id>" }`.
- **Expected Result:** Server must verify that `payment.razorpayOrderId === razorpay_order_id` before marking the payment paid.
- **Actual Result:** Server verifies the signature against the cheap order ID, ignores `payment.razorpayOrderId`, and marks the ₹10,000 bill as PAID in full!
- **Business Impact:** High financial loss; guests can settle dining bills for free or nominal amounts.
- **Remediation:** Enforce `if (payment.razorpayOrderId !== razorpay_order_id) return res.status(400)...`.

---

### BUG-02: Race Condition in Order Number Generation Under Concurrency
- **Severity:** **CRITICAL**
- **Category:** Database Concurrency / Data Integrity
- **Affected File:** `backend/utils/generateOrderNumber.js` (lines 3-11)
- **Reproduction Steps:**
  1. Send 5 simultaneous `POST /api/orders/place` requests within 50 milliseconds for active tables.
  2. Both requests call `Order.countDocuments({ createdAt: ... })`.
- **Expected Result:** Every order receives a unique sequential order number (`ORD-20261119-001`, `002`, `003`, etc.).
- **Actual Result:** Multiple concurrent requests read the same count, generate identical numbers (`ORD-20261119-004`), and trigger MongoDB duplicate key error `E11000` on `{ orderNumber: 1, restaurant: 1 }`, causing orders to fail.
- **Business Impact:** Real-world order loss during busy restaurant hours (lunch/dinner rush).
- **Remediation:** Use an atomic counter collection with `$inc` or append a random high-entropy suffix.

---

### BUG-03: Empty Items Array Accepted as Valid Order
- **Severity:** **HIGH**
- **Category:** Functional Validation
- **Affected File:** `backend/controllers/orderController.js` (lines 9-25)
- **Reproduction Steps:**
  1. Send `POST /api/orders/place` with `items: []`.
- **Expected Result:** HTTP 400 Bad Request: "Cart cannot be empty".
- **Actual Result:** HTTP 201 Created. An empty order with ₹0 subtotal is created in the database and dispatched to the waiter queue.
- **Business Impact:** Clutters kitchen queues with blank tickets; confuses staff.
- **Remediation:** Add validation `if (!Array.isArray(items) || items.length === 0) return res.status(400)...`.

---

### BUG-04: Non-Positive / Zero Quantity Items Cause Server 500
- **Severity:** **HIGH**
- **Category:** Input Validation / Error Handling
- **Affected File:** `backend/controllers/orderController.js` (lines 20-40)
- **Reproduction Steps:**
  1. Send `POST /api/orders/place` with `items: [{ menuItemId: "...", quantity: 0 }]` or `quantity: -5`.
- **Expected Result:** HTTP 400 Bad Request with descriptive message.
- **Actual Result:** HTTP 500 Internal Server Error due to unhandled Mongoose schema validation rejection.
- **Business Impact:** Unprofessional error response; potential mathematical corruption if negative prices are accepted.
- **Remediation:** Validate that `item.quantity` is an integer `>= 1` prior to database execution.

---

### BUG-05: Global Rate Limiter Blocks Hotel Diners Sharing Guest Wi-Fi
- **Severity:** **HIGH**
- **Category:** Architecture / Performance
- **Affected File:** `backend/server.js` (lines 66-73)
- **Reproduction Steps:**
  1. Send 1000 requests from a single IP address within 15 minutes.
- **Expected Result:** Public menu browsing by legitimate diners should remain accessible.
- **Actual Result:** All subsequent diners connecting through the same IP (e.g., hotel Wi-Fi router) receive HTTP 429 "Too many requests".
- **Business Impact:** Complete ordering blackout for all guests in a hotel or restaurant.
- **Remediation:** Increase limit to 10,000 for public browse routes or key by session token.

---

### BUG-06: Razorpay Webhook Signature Calculation Fails on Raw Buffer
- **Severity:** **HIGH**
- **Category:** Payment Integration
- **Affected File:** `backend/controllers/paymentController.js` (line 327)
- **Reproduction Steps:**
  1. Send an official Razorpay webhook payload with `express.raw()`.
- **Expected Result:** HMAC matches signature and records payment capture.
- **Actual Result:** `JSON.stringify(req.body)` turns the Buffer into `{"type":"Buffer","data":[...]}`, invalidating HMAC and rejecting genuine payments.
- **Business Impact:** Asynchronous payments fail to record in the admin dashboard.
- **Remediation:** Calculate HMAC directly using `req.body` or `req.body.toString('utf8')`.

---

### BUG-07: Mass Assignment Allows Changing Restaurant ID on Tables
- **Severity:** **MEDIUM**
- **Category:** Authorization / Multi-Tenancy
- **Affected File:** `backend/controllers/tableController.js` (lines 35-45)
- **Reproduction Steps:**
  1. Send `PUT /api/tables/:id` with `{ "restaurant": "new_tenant_id" }`.
- **Expected Result:** Tenant reference should be immutable.
- **Actual Result:** Mongoose updates all attributes in `req.body`.
- **Remediation:** Whitelist allowed attributes (`displayName`, `capacity`, `floor`, `section`, `status`).

---

### BUG-08: Multi-Tenant Staff Email Collision on Login
- **Severity:** **MEDIUM**
- **Category:** Authentication / Multi-Tenancy
- **Affected File:** `backend/controllers/authController.js` (lines 98-105)
- **Description:** `User.findOne({ email })` queries globally without tenant context, but `models/User.js` allows duplicate emails across different restaurants.
- **Remediation:** Enforce global uniqueness on user emails across the entire SaaS platform.

---

### BUG-09: Unvalidated File Extensions in Multer Upload Middleware
- **Severity:** **MEDIUM**
- **Category:** File Security
- **Affected File:** `backend/middleware/upload.js` (lines 13-25)
- **Description:** Uses client-provided `file.mimetype` and `path.extname(file.originalname)`. Allows saving `.html` or `.svg` files if client sends `image/jpeg`.
- **Remediation:** Strict extension whitelisting (`.jpg`, `.jpeg`, `.png`, `.webp`) and filename sanitization.

---

### BUG-10: Outdated Next.js Dependencies with Known Security Advisories
- **Severity:** **MEDIUM**
- **Category:** Dependency Audit
- **Affected File:** `frontend/package.json`
- **Description:** `npm audit` flags vulnerabilities in `next@14.2.15` and `postcss@8.4.47` (GHSA-9g9p-9gw9-jx7f, GHSA-h25m-26qc-wcjf).
- **Remediation:** Upgrade to latest patched release (`next@14.2.24+`).

---

### BUG-11: Passwords Lack Complexity Requirements
- **Severity:** **LOW**
- **Category:** Authentication Policy
- **Affected File:** `backend/models/User.js` (line 8)
- **Description:** Passwords accept simple 6-character strings (e.g. `123456`).
- **Remediation:** Require minimum 8 characters with at least one letter and one number.

---

### BUG-12: Signature Comparison Uses Non-Constant-Time Equality
- **Severity:** **LOW**
- **Category:** Cryptography
- **Affected File:** `backend/controllers/paymentController.js` (line 100)
- **Description:** Uses `expectedSignature !== razorpay_signature` instead of `crypto.timingSafeEqual`.
- **Remediation:** Use `crypto.timingSafeEqual(Buffer.from(...), Buffer.from(...))`.

---

### BUG-13: Missing Database Transaction on Order Submission
- **Severity:** **LOW**
- **Category:** Data Integrity
- **Affected File:** `backend/controllers/orderController.js` (lines 50-68)
- **Description:** `Order.create` and `TableSession.findByIdAndUpdate` run independently without a session transaction.
- **Remediation:** Wrap in Mongoose transaction session.

---

### BUG-14: Missing Compound Index on Order Session Status
- **Severity:** **LOW**
- **Category:** Performance / Database
- **Affected File:** `backend/models/Order.js`
- **Description:** Bill calculation frequently filters `{ tableSession: session._id, status: { $nin: ['rejected'] } }`.
- **Remediation:** Add compound index `{ tableSession: 1, status: 1 }`.

---

### BUG-15: Lack of Offline Toast / Banner on Mobile Network Drop
- **Severity:** **LOW**
- **Category:** UI/UX Resilience
- **Affected File:** `frontend/app/menu/page.tsx`
- **Description:** When network drops, silent failure occurs until polling fails.
- **Remediation:** Add `window.addEventListener('offline', ...)` indicator.
