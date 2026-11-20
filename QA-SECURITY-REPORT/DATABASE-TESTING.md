# DATABASE AND DATA INTEGRITY TESTING REPORT
**Database Engine:** MongoDB 7.0 Community  
**ODM:** Mongoose v9.12.2  
**Target Database:** `hotel_management`  
**Date:** November 19, 2026  

---

## 1. Schema Architecture & Multi-Tenancy Review

The application implements a multi-tenant shared-database architecture, partitioning data via the `restaurant` reference field across all primary schemas:
- `Restaurant`: Root tenant record containing tax settings, business hours, and payment configurations.
- `User`: Admin, manager, waiter, and kitchen staff accounts.
- `Category`: Restaurant menu groupings.
- `MenuItem`: Individual dishes with prices and availability flags.
- `Table`: Dining tables with unique QR tokens.
- `TableSession`: Dining sessions with session tokens.
- `Order`: Round-by-round order tickets tied to both table and session.
- `Payment`: Bill settlement transactions.

---

## 2. Concurrency & Race Condition Analysis

### Critical Flaw: Non-Atomic Order Number Generation
- **Affected File:** `backend/utils/generateOrderNumber.js`
- **Code:**
  ```javascript
  const generateOrderNumber = async (restaurantId) => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Order.countDocuments({
      restaurant: restaurantId,
      createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)) }
    });
    return `ORD-${dateStr}-${String(count + 1).padStart(3, '0')}`;
  };
  ```
- **Concurrency Test Result:** When 5 simulated orders were submitted concurrently within 50ms, the non-atomic `countDocuments` read the same count for multiple requests before writes committed.
- **Consequence:** Because `orderNumber` has a unique compound index `{ orderNumber: 1, restaurant: 1 }` in `models/Order.js`, the second concurrent order triggered an unhandled MongoDB duplicate key error (`E11000`), failing the customer's order!
- **Architectural Solution:**
  Replace `countDocuments` with an atomic sequence counter using MongoDB's `$inc` on an atomic `Counters` collection or append a cryptographically random suffix / high-resolution timestamp (e.g., `ORD-YYYYMMDD-XXXX`).

---

## 3. Database Indexes Audit

| Collection | Indexed Fields | Index Type | Audit Assessment |
| :--- | :--- | :---: | :--- |
| `restaurants` | `slug` | Unique Single | **PASS** - Ensures clean tenant URLs |
| `restaurants` | `email` | Unique Single | **PASS** - Prevents duplicate tenant registrations |
| `users` | `{ restaurant: 1, email: 1 }` | Unique Compound | **FAIL (Multi-Tenant Collision)** - Allows duplicate emails across tenants, but login queries globally |
| `tables` | `{ restaurant: 1, tableNumber: 1 }` | Unique Compound | **PASS** - Prevents duplicate table numbers within one hotel |
| `tables` | `qrToken` | Unique Single | **PASS** - Guarantees secure, unguessable table QR lookup |
| `tablesessions` | `sessionToken` | Unique Single | **PASS** - Prevents cross-session collision |
| `tablesessions` | `{ restaurant: 1, table: 1, status: 1 }` | Compound | **PASS** - Fast retrieval of active dining sessions |
| `orders` | `{ restaurant: 1, tableSession: 1 }` | Compound | **PASS** - Fast retrieval of session orders |
| `orders` | `{ orderNumber: 1, restaurant: 1 }` | Unique Compound | **PASS** - Prevents duplicate order numbers |
| `payments` | `{ restaurant: 1, paymentStatus: 1 }` | Compound | **PASS** - Accelerates revenue analytics queries |
| `payments` | `billNumber` | Unique Single | **PASS** - Guarantees unique tax invoice numbers |

---

## 4. Transactional Integrity Checks

### Observation on Order Placement Atomicity:
In `backend/controllers/orderController.js`:
```javascript
const order = await Order.create({ ... });
await TableSession.findByIdAndUpdate(session._id, { $inc: { totalAmount: totalAmount } });
```
If an unhandled exception or network disconnect occurs after `Order.create` succeeds but before `TableSession.findByIdAndUpdate` executes, the table session total will diverge from the sum of order totals.
In MongoDB multi-document operations, using a mongoose session transaction (`startSession` / `withTransaction`) guarantees complete rollback if any step fails.
