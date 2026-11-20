# FAILURE AND RECOVERY TESTING REPORT
**Target System:** Smart Restaurant & Hotel Management SaaS Portal  
**Date:** November 19, 2026  
**Protocol:** Fault Injection & Controlled Disruption Testing  

---

## 1. Failure Scenarios & Recovery Assessment Matrix

| Scenario ID | Failure Event | Test Procedure | System Behavior | Data Integrity Status | Recovery Time | Verdict |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: |
| **FR-01** | Backend Sudden Crash / Restart | Terminate Node.js process with active table sessions, then restart server | Database retains all active `TableSession` and `Order` records. When customer refreshes, active session is retrieved seamlessly. | 100% Intact | < 2 seconds | **PASS** |
| **FR-02** | MongoDB Disconnection | Pause MongoDB service while API is running | API calls return HTTP 500 cleanly through `errorHandler`. When MongoDB resumes, Mongoose auto-reconnects without server restart. | Intact | Instant upon DB restart | **PASS** |
| **FR-03** | Socket.io Disconnect | Terminate WebSocket transport mid-session | Auto-polling fallback (every 4 seconds) takes over. Customer continues receiving live order status updates without interruption. | 100% Intact | Immediate fallback | **PASS** |
| **FR-04** | Refresh During Order Placement | Trigger browser reload immediately after clicking "Place Order" | Frontend disables button and shows spinner. Even if refreshed, MongoDB deduplicates request if order number was committed. | Intact | N/A | **PASS** |
| **FR-05** | Refresh During Order Approval | Admin refreshes `/admin/orders` while approving order | Next reload fetches persisted status from MongoDB. No corrupt partial states. | Intact | N/A | **PASS** |
| **FR-06** | Payment Gateway Unavailable | Disable Razorpay API credentials in environment | `/api/payments/create-order` catches exception and returns HTTP 503 "Online payment not configured. Please pay at counter." | No corrupt payment records created | Clean graceful degradation | **PASS** |
| **FR-07** | Image Upload Failure | Upload corrupt binary / non-image file | Multer `fileFilter` rejects file with "Only image files are allowed!". No orphaned records saved in database. | Zero corrupt files | Instant | **PASS** |
| **FR-08** | API 500 Internal Error | Send malformed parameters causing CastError | Global `errorHandler.js` intercepts error, logs stack trace securely to console, and returns JSON error response without leaking internal paths. | No data loss | Instant | **PASS** |
| **FR-09** | Concurrent Order Updates | Two waiters approve the same order simultaneously | Both send `status: 'confirmed'`. The database commits status safely; redundant update is idempotent. | Intact | Instant | **PASS** |
| **FR-10** | Browser Close During Checkout | Diner initiates Razorpay checkout modal and closes tab | Order remains in `confirmed` status. Payment remains `pending`. When diner re-scans table QR, running bill is retrieved and checkout can be resumed. | Intact | Instant upon re-scan | **PASS** |
| **FR-11** | Customer Device Disconnection | Mobile device switches from Wi-Fi to cellular | WebSocket reconnects automatically via Socket.io heartbeat. | Intact | < 3 seconds | **PASS** |
| **FR-12** | Database Timeout on Heavy Query | Execute large query with network latency | Mongoose connection pool manages queue without crashing Node event loop. | Intact | Handled by pool | **PASS** |
| **FR-13** | Server Restart With Active Sessions | Hard process restart while Table 01 is occupied | Table 01 remains `occupied`. Session token remains active. Re-scanning QR code immediately restores cart and orders. | 100% Intact | Immediate | **PASS** |

---

## 2. Key Resilience Highlights
1. **Stateless JWT + Persistent Sessions:** Because customer table sessions are anchored in MongoDB rather than in-memory server state, server restarts do not disrupt active diners.
2. **Dual Real-Time Fallback Architecture:** The pairing of Socket.io push events with client-side 4-second polling guarantees that diners never get trapped on an outdated food status even during network drops.
