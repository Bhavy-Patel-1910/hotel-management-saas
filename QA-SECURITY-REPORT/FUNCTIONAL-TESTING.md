# FUNCTIONAL TESTING REPORT
**Project:** Smart Restaurant & Hotel Management SaaS Portal  
**Test Suite:** Complete Functional & Feature Verification  
**Executed By:** Senior QA Automation Engineer  
**Date:** November 19, 2026  

---

## 1. Customer Ordering Portal Functional Tests

| Test ID | Feature | Steps Performed | Expected Result | Actual Result | Status | Severity | Affected File / API |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **FT-CUST-01** | QR Table Resolution | Call `GET /api/tables/scan/:token` with valid table QR token | Returns restaurant details, table metadata, and active `TableSession` | HTTP 200 with Table 01 details, active session token, restaurant GST/Service Charge configuration | **PASS** | INFORMATIONAL | `/api/tables/scan/:token` (`tableController.js`) |
| **FT-CUST-02** | Invalid QR Token | Call `GET /api/tables/scan/invalid-token-999` | Returns HTTP 404 with error message "Invalid QR code" | HTTP 404 `{"success":false,"message":"Invalid QR code"}` | **PASS** | LOW | `/api/tables/scan/:token` (`tableController.js`) |
| **FT-CUST-03** | Menu Categories | Call `GET /api/menu/public/:restaurantId/categories` | Returns all active categories sorted by `sortOrder` | HTTP 200 with 8 seeded categories (Starters, Main Course, Chinese, etc.) | **PASS** | INFORMATIONAL | `/api/menu/public/:restaurantId/categories` |
| **FT-CUST-04** | Available Dishes | Call `GET /api/menu/public/:restaurantId/items` | Returns all items where `isAvailable: true` | HTTP 200 with 25 dishes containing images, descriptions, prices, veg/non-veg tags | **PASS** | INFORMATIONAL | `/api/menu/public/:restaurantId/items` |
| **FT-CUST-05** | Category Filter | Query `/api/menu/public/:restaurantId/items?category=<id>` | Returns only dishes belonging to selected category | HTTP 200 with exactly the dishes assigned to the queried category | **PASS** | LOW | `/api/menu/public/:restaurantId/items` |
| **FT-CUST-06** | Diet Type Filter | Query `/api/menu/public/:restaurantId/items?foodType=veg` | Returns only vegetarian items | HTTP 200, 100% of returned items have `foodType === 'veg'` | **PASS** | LOW | `/api/menu/public/:restaurantId/items` |
| **FT-CUST-07** | Search Filter | Query `/api/menu/public/:restaurantId/items?search=paneer` | Returns dishes with "paneer" in title/description | HTTP 200 with Paneer Tikka Royale and Paneer Butter Masala | **PASS** | LOW | `/api/menu/public/:restaurantId/items` |
| **FT-CUST-08** | Add to Cart | Add item via frontend `useCart` hook | Cart quantity increments, subtotal calculates dynamically | Cart badge updates with item count and subtotal accurately | **PASS** | INFORMATIONAL | `CartContext.tsx` |
| **FT-CUST-09** | Cart Quantities | Increase/decrease quantity in cart modal | Subtotal adjusts according to unit price × quantity | Subtotal adjusts smoothly; quantity cannot decrease below 0 | **PASS** | INFORMATIONAL | `CartContext.tsx` |
| **FT-CUST-10** | Special Instructions | Enter custom preparation note in cart form | Instructions stored and passed in order payload | Note saved and displayed in kitchen ticket | **PASS** | INFORMATIONAL | `frontend/app/menu/page.tsx` |
| **FT-CUST-11** | Submit Order | Call `POST /api/orders/place` with items array & session token | Generates unique order number, assigns `pending_approval` status, calculates GST & service charge | HTTP 201 with order number `ORD-YYYYMMDD-XXX`, subtotal, and tax calculations | **PASS** | INFORMATIONAL | `/api/orders/place` (`orderController.js`) |
| **FT-CUST-12** | Empty Cart Order | Submit order with `items: []` | Should reject with HTTP 400 Bad Request | Server returned HTTP 201 and created empty order with ₹0 subtotal! | **FAIL** | **HIGH** | `backend/controllers/orderController.js` |
| **FT-CUST-13** | Zero Quantity Order | Submit item with `quantity: 0` | Should reject with HTTP 400 Bad Request | Server threw HTTP 500 Mongoose validation error instead of clean 400 | **FAIL** | **HIGH** | `backend/controllers/orderController.js` |
| **FT-CUST-14** | Negative Quantity | Submit item with `quantity: -5` | Should reject with HTTP 400 Bad Request | Server threw HTTP 500 error instead of clean 400 validation error | **FAIL** | **HIGH** | `backend/controllers/orderController.js` |
| **FT-CUST-15** | Non-existent Item | Submit item with non-existent `menuItemId` | Should reject with HTTP 400 "Item not available" | Server returned HTTP 400 "Item not available" | **PASS** | MEDIUM | `backend/controllers/orderController.js` |
| **FT-CUST-16** | Expired Session | Submit order with expired or invalid `sessionToken` | Should reject with HTTP 404 "Invalid or expired session" | Server returned HTTP 404 `{"success":false,"message":"Invalid or expired session"}` | **PASS** | LOW | `backend/controllers/orderController.js` |
| **FT-CUST-17** | Session Orders List | Call `GET /api/orders/session/:sessionToken` | Returns all orders placed by the current table session | HTTP 200 with list of orders, round identifiers, and statuses | **PASS** | INFORMATIONAL | `/api/orders/session/:token` |
| **FT-CUST-18** | Reordering (Round 2) | Submit second order under existing active session | Preserves round 1 order and appends round 2 order | Both orders exist distinctly; neither order is overwritten | **PASS** | INFORMATIONAL | `backend/controllers/orderController.js` |
| **FT-CUST-19** | Running Bill | Call `GET /api/payments/bill/:sessionToken` | Consolidates all non-rejected orders with tax breakdown | HTTP 200 with accurate running bill, 5% GST, and 2% service charge | **PASS** | INFORMATIONAL | `/api/payments/bill/:token` |

---

## 2. Admin & Staff Management Functional Tests

| Test ID | Feature | Steps Performed | Expected Result | Actual Result | Status | Severity | Affected File / API |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **FT-ADM-01** | Admin Login | Submit valid email and password to `POST /api/auth/login` | HTTP 200 with JWT token, user role `admin`, and restaurant metadata | HTTP 200, JWT token returned, user role `admin` verified | **PASS** | INFORMATIONAL | `/api/auth/login` (`authController.js`) |
| **FT-ADM-02** | Invalid Password | Submit invalid password to `POST /api/auth/login` | HTTP 401 Invalid credentials | HTTP 401 `{"success":false,"message":"Invalid credentials"}` | **PASS** | LOW | `/api/auth/login` (`authController.js`) |
| **FT-ADM-03** | Auth Profile | Call `GET /api/auth/me` with Bearer token | HTTP 200 with sanitized user profile (password excluded) | HTTP 200 with user profile and restaurant object | **PASS** | INFORMATIONAL | `/api/auth/me` (`authController.js`) |
| **FT-ADM-04** | Order Management | Call `GET /api/orders` with admin token | Returns list of restaurant orders with table and waiter info | HTTP 200 with paginated orders list and populated table metadata | **PASS** | INFORMATIONAL | `/api/orders` (`orderController.js`) |
| **FT-ADM-05** | Order Approval | Call `PUT /api/orders/:id/status` with `status: "confirmed"` | Status updates to `confirmed`, `confirmedBy` populated, real-time socket emitted | HTTP 200, status `confirmed`, waiter ID attached, socket event dispatched | **PASS** | INFORMATIONAL | `/api/orders/:id/status` |
| **FT-ADM-06** | Order Preparing | Call `PUT /api/orders/:id/status` with `status: "preparing"` | Status updates to `preparing`, `preparingAt` timestamp recorded | HTTP 200, status `preparing`, timestamp recorded | **PASS** | INFORMATIONAL | `/api/orders/:id/status` |
| **FT-ADM-07** | Order Ready | Call `PUT /api/orders/:id/status` with `status: "ready"` | Status updates to `ready`, ready timestamp recorded | HTTP 200, status `ready`, diner notified | **PASS** | INFORMATIONAL | `/api/orders/:id/status` |
| **FT-ADM-08** | Order Served | Call `PUT /api/orders/:id/status` with `status: "served"` | Status updates to `served`, served timestamp recorded | HTTP 200, status `served` | **PASS** | INFORMATIONAL | `/api/orders/:id/status` |
| **FT-ADM-09** | Order Rejection | Call `PUT /api/orders/:id/status` with `status: "rejected"` and reason | Status updates to `rejected`, reason stored | HTTP 200, order rejected with reason stored | **PASS** | INFORMATIONAL | `/api/orders/:id/status` |
| **FT-ADM-10** | Table Management | Call `GET /api/tables` | Returns all active restaurant tables | HTTP 200 with 8 seeded tables and QR tokens | **PASS** | INFORMATIONAL | `/api/tables` (`tableController.js`) |
| **FT-ADM-11** | Create Table | Call `POST /api/tables` with capacity & number | New table created with auto-generated QR code | HTTP 201 with generated table, uuid `qrToken`, and QR image data | **PASS** | INFORMATIONAL | `/api/tables` (`tableController.js`) |
| **FT-ADM-12** | Regenerate QR | Call `POST /api/tables/:id/regenerate-qr` | New `qrToken` generated, new QR code image rendered | HTTP 200 with new QR token and updated URL | **PASS** | INFORMATIONAL | `/api/tables/:id/regenerate-qr` |
| **FT-ADM-13** | Category Management | Call `POST /api/menu/categories` | New category created with custom `sortOrder` | HTTP 201 with category object | **PASS** | INFORMATIONAL | `/api/menu/categories` |
| **FT-ADM-14** | Delete Active Cat | Delete category containing menu items | Rejection with HTTP 400 prevents orphaned menu items | HTTP 400 `Cannot delete category with X menu items` | **PASS** | LOW | `/api/menu/categories/:id` |
| **FT-ADM-15** | Cash Settlement | Call `POST /api/payments/cash/:tableSessionId` | Marks payment as paid, bill generated, table set to cleaning | HTTP 200 with `paymentStatus: "paid"`, bill number, and session closed | **PASS** | INFORMATIONAL | `/api/payments/cash/:sessionId` |
| **FT-ADM-16** | Duplicate Cash Pay | Call `POST /api/payments/cash/:tableSessionId` a second time | Rejection with HTTP 400 "Already paid" prevents duplicate revenue | HTTP 400 `{"success":false,"message":"Already paid"}` | **PASS** | MEDIUM | `/api/payments/cash/:sessionId` |
| **FT-ADM-17** | Revenue Analytics | Call `GET /api/payments/revenue` | Aggregates daily, weekly, monthly, and yearly revenue | HTTP 200 with numeric values for today, yesterday, week, month, year, lifetime | **PASS** | INFORMATIONAL | `/api/payments/revenue` |
| **FT-ADM-18** | Staff Management | Create waiter via `POST /api/restaurant/staff` | New staff user created with role `waiter` and limited permissions | HTTP 201 with staff user profile | **PASS** | INFORMATIONAL | `/api/restaurant/staff` |
| **FT-ADM-19** | Role Permissions | Waiter attempts to edit restaurant profile settings | Rejection with HTTP 403 Forbidden | HTTP 403 `{"success":false,"message":"Role waiter is not authorized"}` | **PASS** | HIGH | `/api/restaurant` (`auth.js`) |
| **FT-ADM-20** | Restaurant Settings | Update GST rate and service charge via `PUT /api/restaurant` | Changes persist in MongoDB and reflect on subsequent customer bills | HTTP 200 with updated restaurant settings | **PASS** | INFORMATIONAL | `/api/restaurant` |
