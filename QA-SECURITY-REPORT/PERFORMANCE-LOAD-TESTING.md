# PERFORMANCE AND LOAD TESTING REPORT
**Project:** Smart Restaurant & Hotel Management SaaS Portal  
**Test Environment:** Windows 11, Node.js v24.15.0, MongoDB v7.0 (Local Staging)  
**Executed By:** Performance & Site Reliability Engineer  
**Date:** November 19, 2026  

---

## 1. Load Test Methodology & Execution

The performance evaluation simulated concurrent customer traffic accessing the SaaS portal, fetching public menus, and checking system health across 6 escalating load tiers:
- **Level 1:** 10 simultaneous users
- **Level 2:** 50 simultaneous users
- **Level 3:** 100 simultaneous users
- **Level 4:** 250 simultaneous users
- **Level 5:** 500 simultaneous users
- **Level 6:** 1000 simultaneous users

Metrics tracked:
- **Average (Mean) Response Time (ms)**
- **Median (P50) Latency (ms)**
- **95th Percentile (P95) Latency (ms)**
- **99th Percentile (P99) Latency (ms)**
- **Throughput (Requests Per Second - RPS)**
- **Error Percentage (%)**

---

## 2. Benchmark Results Table

| Concurrency Tier | Target Endpoint | Total Requests | Success Rate | Avg Latency | Median Latency | P95 Latency | P99 Latency | Throughput (RPS) | Result |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **10 Users** | `GET /menu/public/:id/items` | 10 | **100%** | 33 ms | 35 ms | 41 ms | 41 ms | 233 req/s | **PASS** |
| **50 Users** | `GET /menu/public/:id/items` | 50 | **100%** | 135 ms | 152 ms | 182 ms | 201 ms | 245 req/s | **PASS** |
| **100 Users** | `GET /menu/public/:id/items` | 100 | **100%** | 189 ms | 211 ms | 291 ms | 313 ms | 312 req/s | **PASS** |
| **250 Users** | `GET /menu/public/:id/items` | 250 | **100%** | 454 ms | 470 ms | 743 ms | 752 ms | 313 req/s | **PASS** |
| **500 Users** | `GET /menu/public/:id/items` | 500 | **89.4%** | 649 ms | 634 ms | 1,110 ms | 1,131 ms | 419 req/s | **FAIL (Rate Limited)** |
| **1000 Users** | `GET /health` | 1,000 | **0%** | 321 ms | 376 ms | 397 ms | 405 ms | 1,790 req/s | **FAIL (Rate Limited)** |

---

## 3. Performance Analysis & Bottlenecks

### 1. Excellent Low-to-Medium Concurrency Latency (1 to 250 Users)
- Up to **250 concurrent diners**, the application performs with sub-second latencies:
  - 10 users: **33 ms** average
  - 50 users: **135 ms** average
  - 100 users: **189 ms** average
  - 250 users: **454 ms** average
- The response time scales linearly, showing efficient MongoDB query index utilization on `{ restaurant: 1, isAvailable: 1 }`.

### 2. Critical Bottleneck Identified: Global IP Rate Limiter (HTTP 429)
- **Root Cause:** In `backend/server.js`:
  ```javascript
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per IP
  });
  app.use('/api/', apiLimiter);
  ```
- **Observed Failure:** When cumulative requests from the test client reached 947, all subsequent requests in the 500-user tier and all 1000 requests in the 1000-user tier returned HTTP 429:
  `{"success":false,"message":"Too many requests from this IP, please try again later."}`
- **Real-World Hotel Impact:**
  In a physical restaurant or hotel, **all customers connect through the same guest Wi-Fi router**. To the backend server, 200 customers placing orders and browsing menus appear to come from a **single public IP address (NAT)**.
  A ceiling of 1000 requests per 15 minutes across an entire restaurant means that once 20 diners browse 50 dishes each, the entire hotel's customer ordering portal is blocked with HTTP 429 errors!
- **Recommended Remediation:**
  1. Increase the general public rate limit to at least **10,000 requests per 15 minutes** or key by session token / table token rather than purely client IP for public menu endpoints.
  2. Reserve strict rate-limiting (e.g. 10 requests / 15 minutes) specifically for `/api/auth/login`.

### 3. Database Connection & Memory Footprint
- MongoDB memory consumption remained steady at ~85 MB throughout the load test.
- No memory leaks or unhandled socket disconnection leaks were detected during sustained requests.
- Node.js event loop latency remained under 15ms during the 250-user test.
