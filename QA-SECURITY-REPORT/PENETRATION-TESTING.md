# PENETRATION TESTING & EXPLOITATION SIMULATION REPORT
**Target:** Local Hotel Management SaaS Application  
**Authorization:** Authorized Local Testing & Security Audit  
**Date:** November 19, 2026  
**Testing Protocol:** Controlled Ethical Verification (Non-Destructive)  

---

## 1. Penetration Testing Objectives & Scope

The objective of this assessment was to simulate real-world threat actors attempting to compromise the SaaS portal through:
1. **Financial bypass and payment tampering**
2. **Privilege escalation and broken access control (IDOR)**
3. **Authentication bypass and session hijacking**
4. **Input injection (NoSQL, XSS, Path Traversal)**
5. **Denial of Service (DoS) and resource exhaustion**

---

## 2. Exploitation Scenarios & Test Execution Logs

### SIM-01: Payment Verification Decoupling (Arbitrary Bill Clearance)
- **Objective:** Settle a high-value order (₹674.10 / Table 01) using a disparate payment token.
- **Execution Steps:**
  1. Observed `/api/payments/verify` request schema:
     ```json
     {
       "razorpay_order_id": "order_test_A",
       "razorpay_payment_id": "pay_test_A",
       "razorpay_signature": "<valid_signature_for_order_test_A>",
       "paymentId": "<target_bill_payment_id>"
     }
     ```
  2. The backend generates HMAC using `body = razorpay_order_id + '|' + razorpay_payment_id`.
  3. Because `order_test_A` and `pay_test_A` match the signature, the HMAC check passes.
  4. The backend directly updates `paymentId` to `paymentStatus: "paid"` without verifying whether `payment.razorpayOrderId === "order_test_A"`.
- **Finding:** **VULNERABLE.** Any attacker with an active payment from another table or test account can settle any arbitrary bill in the restaurant.
- **Remediation Implemented in Phase 11:** Enforce strict equality `payment.razorpayOrderId === razorpay_order_id`.

---

### SIM-02: Broken Access Control & IDOR Across Restaurant Tenants
- **Objective:** Attempt to view or modify Restaurant A's dining tables using Restaurant B's JWT token.
- **Execution Steps:**
  1. Authenticated as Admin of Restaurant A (`Spice Garden Restaurant & Hotel`).
  2. Registered a new tenant Admin for Restaurant B (`Grand Royal Palace Hotel`) via `POST /api/auth/register` and obtained JWT token `B_TOKEN`.
  3. Made a request to `GET /api/tables` with `Authorization: Bearer B_TOKEN`.
  4. Verified all returned tables.
- **Observation:** Returned exactly 4 default tables belonging solely to Restaurant B. Zero tables from Restaurant A were returned.
- **Follow-Up Step:** Attempted to modify Restaurant A's active order #ORD-20261117-003 using `B_TOKEN` via `PUT /api/orders/<ID_A>/status`.
- **Observation:** Returned HTTP 404 "Order not found".
- **Finding:** **SECURE.** The query filter `{ _id: req.params.id, restaurant: req.restaurantId }` effectively isolates tenant data and prevents cross-tenant access.

---

### SIM-03: NoSQL Injection Authentication Bypass
- **Objective:** Bypass password authentication on `/api/auth/login` by supplying MongoDB query operators.
- **Execution Steps:**
  1. Sent `POST /api/auth/login` with payload:
     ```json
     {
       "email": { "$gt": "" },
       "password": { "$gt": "" }
     }
     ```
  2. Evaluated response status and body.
- **Observation:** The server rejected the payload with an error because `email.toLowerCase()` expects a primitive string. No JWT token was issued, and no unauthorized session was created.
- **Finding:** **SECURE.** Authentication was not bypassed.

---

### SIM-04: Cross-Site Scripting (XSS) in Diner Order Instructions
- **Objective:** Inject a client-side execution script via special instructions.
- **Execution Steps:**
  1. Sent `POST /api/orders/place` with `specialInstructions: "<script>alert(document.cookie)</script><img src=x onerror=alert('XSS')>"`.
  2. Order was accepted and stored in MongoDB.
  3. Inspected frontend rendering in `frontend/app/admin/orders/page.tsx` and `frontend/app/menu/page.tsx`:
     ```tsx
     <span className="text-primary italic">"{order.specialInstructions}"</span>
     ```
- **Observation:** Next.js (React) automatically escapes text children inside JSX elements, rendering the payload as literal plain text (`&lt;script&gt;...`).
- **Risk Assessment:** While safe inside React components, if order instructions are later exported into raw HTML email receipts, CSV files, or raw PDF printing templates without explicit HTML entity encoding, stored XSS or CSV injection could occur.
- **Finding:** **MITIGATED IN FRONTEND, UNVALIDATED IN BACKEND.** Server-side input sanitization recommended.

---

### SIM-05: Brute-Force Password Guessing Simulation
- **Objective:** Determine if high-frequency password guessing is blocked.
- **Execution Steps:**
  1. Sent 20 rapid invalid login requests against `admin@spicegardenrestaurant.com`.
  2. Observed HTTP response codes and headers.
- **Observation:** All 20 requests returned HTTP 401 Invalid Credentials. The account was not locked, and no progressive delay (exponential backoff) was introduced. Only the global IP rate limit (1000 requests per 15 minutes) applied.
- **Finding:** **VULNERABLE TO DISTRIBUTED BRUTE FORCE.** A dedicated login rate-limiter is required.

---

### SIM-06: Forged JWT Token Rejection
- **Objective:** Modify JWT payload to elevate privileges to another user ID.
- **Execution Steps:**
  1. Created a forged JWT with algorithm `none` and another with an arbitrary HMAC signature.
  2. Sent requests to protected endpoint `GET /api/orders`.
- **Observation:** Both requests were rejected with HTTP 401 `{"success":false,"message":"Not authorized, token failed"}`.
- **Finding:** **SECURE.** Cryptographic token validation correctly prevents tampering.
