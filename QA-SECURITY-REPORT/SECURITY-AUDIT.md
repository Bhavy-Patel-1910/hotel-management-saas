# SECURITY AUDIT & VULNERABILITY ASSESSMENT REPORT
**Project:** Smart Restaurant & Hotel Management SaaS Portal  
**Scope:** Source Code Review, API Security Audit, Multi-Tenancy Architecture, Cryptographic Verification  
**Auditor:** Senior Security Auditor & Ethical Hacker  
**Date:** November 19, 2026  

---

## 1. Executive Summary

A comprehensive architectural and code-level security audit was conducted against the backend and frontend codebases. The assessment reviewed access control models, cryptographic operations, session management, multi-tenant isolation, input handling, and payment processing.

### Key Security Posture Findings:
- **Authentication:** Strong bcrypt hashing (salt rounds: 12) and JWT token validation with role checks.
- **Tenant Isolation:** Database queries predominantly isolate records by `restaurant: req.restaurantId`.
- **CRITICAL Vulnerability Identified:** The Razorpay payment verification controller validates the HMAC signature but fails to bind the verified payment to `payment.razorpayOrderId`. An attacker can exploit this to settle high-value bills using low-value payments.
- **HIGH Vulnerability Identified:** Webhook HMAC calculation attempts to stringify an `express.raw()` buffer, breaking signature verification for production payment webhooks.
- **MEDIUM Vulnerability Identified:** Mass assignment in table update controllers allows modifying tenant assignment (`restaurant`).

---

## 2. Granular Vulnerability Catalog

### VULN-01: Decoupled Razorpay Order ID Verification (Arbitrary Bill Settlement)
- **Vulnerability Type:** CWE-347: Improper Verification of Cryptographic Signature / Broken Business Logic
- **Severity:** **CRITICAL (CVSS 9.1)**
- **Affected File:** `backend/controllers/paymentController.js` (lines 90-137)
- **Vulnerable Code:**
  ```javascript
  const verifyRazorpayPayment = async (req, res, next) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Payment verification failed' });
      }

      const payment = await Payment.findByIdAndUpdate(paymentId, { paymentStatus: 'paid', ... });
      ...
  ```
- **Exploit Scenario:**
  1. An attacker places an expensive banquet order of ₹25,000 at Table 01 (`paymentId: "6afc..."`).
  2. The attacker uses a secondary browser or API call to initiate a legitimate ₹1 item order (`razorpay_order_id: "order_CHEAP_01"`).
  3. The attacker completes the ₹1 transaction on Razorpay and obtains a valid signature for `order_CHEAP_01` and `pay_CHEAP_01`.
  4. The attacker posts `{ razorpay_order_id: "order_CHEAP_01", razorpay_payment_id: "pay_CHEAP_01", razorpay_signature: "<valid_sig>", paymentId: "<ID of ₹25,000 order>" }` to `/api/payments/verify`.
  5. The HMAC matches because the signature is genuinely valid for `order_CHEAP_01`.
  6. The server marks the ₹25,000 banquet bill as PAID in full without checking whether `payment.razorpayOrderId === razorpay_order_id`!
- **Impact:** Complete financial loss for the restaurant; unauthorized bill clearances.
- **Remediation:**
  1. Look up the payment record first using `paymentId`.
  2. Verify that `payment.razorpayOrderId === razorpay_order_id`.
  3. Verify that `payment.paymentStatus !== 'paid'` to prevent replay.
  4. Use `crypto.timingSafeEqual` for constant-time signature comparison.

---

### VULN-02: Buffer Serialization Failure in Razorpay Webhook Signature
- **Vulnerability Type:** CWE-347: Improper Signature Validation
- **Severity:** **HIGH (CVSS 7.5)**
- **Affected File:** `backend/controllers/paymentController.js` (lines 323-336)
- **Vulnerable Code:**
  ```javascript
  const razorpayWebhook = async (req, res, next) => {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const signature = req.headers['x-razorpay-signature'];
      const body = JSON.stringify(req.body); // <-- BUG: req.body is already a Buffer from express.raw()
      const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
  ```
- **Exploit / Impact:** When Razorpay sends genuine payment capture webhooks, `JSON.stringify(req.body)` converts the Buffer into `{"type":"Buffer","data":[...]}` instead of the raw payload string. The computed signature never matches `x-razorpay-signature`, rejecting 100% of webhook events. Asynchronous payments (e.g. UPI collect or delayed card authorizations) will remain unpaid in the database.
- **Remediation:** Compute HMAC directly over `req.body` using `req.body.toString('utf8')` or pass the Buffer directly to `update(req.body)`.

---

### VULN-03: Mass Assignment in Table Update Endpoint
- **Vulnerability Type:** CWE-915: Improperly Controlled Modification of Dynamically Determined Object Attributes
- **Severity:** **MEDIUM (CVSS 6.5)**
- **Affected File:** `backend/controllers/tableController.js` (lines 35-45)
- **Vulnerable Code:**
  ```javascript
  const updateTable = async (req, res, next) => {
    try {
      const table = await Table.findOneAndUpdate(
        { _id: req.params.id, restaurant: req.restaurantId },
        req.body, // <-- Passes un-whitelisted user body directly to MongoDB
        { new: true }
      );
  ```
- **Exploit Scenario:** An authenticated staff member or malicious admin can include `{ "restaurant": "<competitor_restaurant_id>" }` or `{ "qrToken": "<targeted_table_token>" }` in the update payload, altering tenant ownership or hijacking table QR sessions.
- **Remediation:** Explicitly whitelist permitted update fields:
  ```javascript
  const { displayName, capacity, floor, section, status } = req.body;
  const table = await Table.findOneAndUpdate(
    { _id: req.params.id, restaurant: req.restaurantId },
    { displayName, capacity, floor, section, status },
    { new: true, runValidators: true }
  );
  ```

---

### VULN-04: Multi-Tenant Email Collision at Login
- **Vulnerability Type:** CWE-287: Improper Authentication
- **Severity:** **MEDIUM (CVSS 6.0)**
- **Affected File:** `backend/controllers/authController.js` (lines 98-105)
- **Vulnerable Code:**
  ```javascript
  const user = await User.findOne({ email: email.toLowerCase() }).populate('restaurant');
  ```
- **Description:** In `models/User.js`, the uniqueness constraint is defined as a compound index `{ restaurant: 1, email: 1 }`. This means two different restaurants can legitimately register staff with the same email (e.g., `manager@hotel.com`). However, the login endpoint queries purely by `email` without tenant context. Whichever user record matches first in MongoDB will be selected for authentication, creating account ambiguity across tenants.
- **Remediation:** Enforce global uniqueness on `email` across all users or require a tenant identifier (restaurant slug) during authentication.

---

### VULN-05: Unrestricted File Extension and MIME Type Handling in Image Uploads
- **Vulnerability Type:** CWE-434: Unrestricted Upload of File with Dangerous Type
- **Severity:** **MEDIUM (CVSS 5.8)**
- **Affected File:** `backend/middleware/upload.js` (lines 13-25)
- **Vulnerable Code:**
  ```javascript
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    }
  ```
- **Exploit Scenario:**
  1. An attacker sends a file with `Content-Type: image/svg+xml` or `image/jpeg` containing embedded JavaScript or an HTML payload (`<svg onload=alert(1)>` or `malicious.html`).
  2. `upload.js` blindly extracts `path.extname(file.originalname)` and saves the file with its original extension (`.html` or `.svg`).
  3. The static file server `app.use('/uploads', express.static(uploadsDir))` serves the file.
  4. Accessing `http://localhost:5000/uploads/image-xxx.html` executes JavaScript in the victim's browser context (Stored Cross-Site Scripting).
- **Remediation:** Whitelist strictly safe extensions (`.jpg`, `.jpeg`, `.png`, `.webp`), strip original extensions, and verify file magic-number signatures.

---

### VULN-06: Lack of Dedicated Brute-Force Protection on Authentication Endpoints
- **Vulnerability Type:** CWE-307: Improper Restriction of Excessive Authentication Attempts
- **Severity:** **MEDIUM (CVSS 5.3)**
- **Affected File:** `backend/routes/authRoutes.js`
- **Description:** The `/api/auth/login` route relies solely on the global rate limiter (1000 requests per 15 minutes). There is no specific account lockout or progressive delay for repeated failed password attempts on a specific account or IP address.
- **Remediation:** Implement a dedicated strict rate limiter on `/api/auth/login` (maximum 5 failed attempts per 15 minutes per IP/account).

---

## 3. Security Checklist Verification Matrix

| Area | Security Check | Audit Status | Evidence / Notes |
| :--- | :--- | :---: | :--- |
| **Authentication** | Password Hashing | **PASS** | Bcrypt with 12 salt rounds (`models/User.js`) |
| **Authentication** | JWT Signature Verification | **PASS** | Rejects forged signatures and `none` algorithm tokens |
| **Authentication** | Password in API Responses | **PASS** | Stripped via `User.methods.toJSON()` |
| **Authorization** | Admin Route Protection | **PASS** | Rejects unauthenticated requests with HTTP 401 |
| **Authorization** | Role-Based Access Control | **PASS** | Waiters forbidden from admin endpoints (HTTP 403) |
| **Multi-Tenancy** | Cross-Tenant Table Access | **PASS** | Queries scoped by `restaurant: req.restaurantId` |
| **Multi-Tenancy** | Cross-Tenant Order Updates | **PASS** | Rejects updating orders belonging to other restaurants (HTTP 404) |
| **Injection** | NoSQL Injection (Login) | **PASS** | Object payloads caught and rejected |
| **Injection** | Stored XSS in Order Notes | **PASS** | Stored safely as raw string, automatically escaped in React JSX |
| **Cryptography** | Timing Safe Signature Check | **FAIL** | Standard equality (`!==`) used instead of `timingSafeEqual` |
| **Payment Security** | Signature Verification | **PASS** | Forged Razorpay HMAC signatures rejected with HTTP 400 |
| **Payment Security** | Order ID Binding | **FAIL** | Order ID not matched against verified payment record (VULN-01) |
| **Payment Security** | Webhook Processing | **FAIL** | Buffer stringification breaks webhook verification (VULN-02) |
| **Network Security** | Security Headers | **PASS** | Helmet enabled with `X-Content-Type-Options: nosniff` |
| **Network Security** | CORS Policy | **PASS** | Origins restricted to configured frontend domains |
