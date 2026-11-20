# Smart Restaurant & Hotel Management SaaS Portal

A production-ready, multi-tenant Smart Restaurant & Hotel Management Web Application engineered for commercial SaaS deployment to hotels, restaurants, and cafes.

Built with **Next.js 14**, **React**, **TypeScript**, **Tailwind CSS**, **Node.js**, **Express.js**, **MongoDB (Mongoose)**, **Socket.io** (real-time order dispatch), and **Razorpay** (online UPI/Card billing).

---

## 🌟 Key Application Architecture & Interfaces

The system is separated into two dedicated applications:

### 1. Customer Ordering Portal (`/menu?table=<qrToken>`)
- **Zero App/Login Friction**: Customers scan the table QR code and the portal instantly detects the restaurant and table number.
- **Visual Food Menu**: Delicious photos, Veg/Non-Veg icons, Chef's Specials, preparation times, and category tabs.
- **Cart & Special Instructions**: Real-time quantity adjustment, allergen/cooking notes, subtotal, GST, and service charge calculation.
- **Multi-Round Reordering / Add Extra Items**: Customers can place initial starters, re-scan or refresh later to add main course/beverages. **Previous orders are never overwritten**; each round remains separately tracked while maintaining a combined table running bill.
- **Live Status Tracking**: WebSocket alerts as the kitchen changes status (`Waiting for Waiter` → `Order Confirmed` → `Chef is Cooking` → `Food Ready` → `Served`).
- **Flexible Bill Checkout**:
  - **Online**: Instant Razorpay payment via UPI (Google Pay, PhonePe, Paytm), Credit/Debit cards, or NetBanking.
  - **Counter/Cash**: Option to pay at counter or request the waiter.

### 2. Hotel Admin & Staff Dashboard (`/admin/login`)
- **Dashboard Overview**: Today's revenue, order counts, pending approvals, active occupied tables, and 14-day trends.
- **Live Order Management**: Waiter approval queue with Accept/Reject actions, one-click stage progression (`Confirmed` → `Preparing` → `Ready` → `Served` → `Completed`).
- **Menu Management (CRUD)**: Create, edit, toggle availability, upload dish photography, set prices, and tag chef specials.
- **Category Management**: Arrange display sort order and descriptions.
- **Tables & QR Generation**: Automatically generates high-resolution QR codes encoded with secure UUID tokens; download PNG or 1-click print table tent stands.
- **Billing & Invoices**: Searchable transaction logs, printable formal tax receipts with GST and service charges.
- **Revenue Analytics**: Strictly audits **paid orders** (excluding rejected/cancelled). Visual charts for daily, weekly, monthly, and yearly revenue with Recharts.
- **Settings & Staff**: Logo upload, opening hours, GST configuration, and role-based staff logins (Waiters, Kitchen, Managers).

---

## 🎨 UI/UX Color Palette

The interface uses a restaurant-inspired palette:

| Role | Color Name | Hex Code | Purpose |
| :--- | :--- | :--- | :--- |
| **Primary** | Deep Espresso | `#3B2118` | Headers, sidebar, branding, typography |
| **Secondary** | Warm Terracotta | `#C65D3A` | Primary CTA buttons, accents, highlights |
| **Accent** | Saffron Yellow | `#F4B942` | Chef's specials, badges, rating stars |
| **Background**| Warm Cream | `#FFF8EE` | Warm culinary canvas background |
| **Cards** | Pure White | `#FFFFFF` | Food cards, elevated containers |
| **Text** | Charcoal Roast | `#29221F` | High readability typography |
| **Success** | Forest Green | `#248A52` | Veg badge, order confirmed, paid status |
| **Danger** | Crimson Chili | `#D94A45` | Non-veg badge, cancel, reject, delete |

---

## 📂 Project Structure

```
hotel-management/
│
├── frontend/                     # Next.js 14 TypeScript Application
│   ├── app/
│   │   ├── admin/
│   │   │   ├── analytics/        # Revenue reports & charts
│   │   │   ├── billing/          # Invoices & payment logs
│   │   │   ├── categories/       # Food category CRUD
│   │   │   ├── dashboard/        # KPI summary & live alerts
│   │   │   ├── login/            # Staff authentication
│   │   │   ├── menu/             # Dish CRUD & image upload
│   │   │   ├── orders/           # Kitchen lifecycle & approvals
│   │   │   ├── settings/         # Restaurant branding & staff accounts
│   │   │   └── tables/           # Table QR generator & print stands
│   │   ├── menu/                 # Customer mobile-first QR ordering portal
│   │   ├── globals.css           # Tailwind custom styles
│   │   ├── layout.tsx            # Root layout with Toast provider
│   │   └── page.tsx              # Landing page
│   ├── components/admin/         # AdminSidebar, AdminGuard
│   ├── context/                  # AuthContext, CartContext
│   ├── services/                 # Axios API service client
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── backend/                      # Node.js & Express.js REST API
│   ├── config/database.js        # MongoDB Mongoose connection
│   ├── controllers/              # Auth, Menu, Table, Order, Payment, Staff
│   ├── middleware/               # JWT auth, role RBAC, Multer upload, errors
│   ├── models/                   # Restaurant, User, Category, MenuItem, Table, TableSession, Order, Payment
│   ├── routes/                   # API routes
│   ├── sockets/index.js          # Socket.io real-time rooms & broadcasts
│   ├── utils/                    # Seed script, QR generator, Order/Bill numbering
│   ├── server.js                 # HTTP + WebSocket server entry point
│   ├── package.json
│   └── .env
│
├── README.md
└── .gitignore
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (`node -v`)
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or a MongoDB Atlas cloud URI.

---

### Step 1: Backend Installation & Setup

1. Open your terminal in the backend directory:
   ```bash
   cd "HOTEL MANAGEMENT/backend"
   ```

2. Dependencies are already installed. If running on a new machine:
   ```bash
   npm install
   ```

3. Configure your `.env` file (a pre-configured `.env` is already created):
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/hotel_management
   JWT_SECRET=super_secure_hotel_mgmt_jwt_secret_key_2026_x89a
   JWT_EXPIRE=7d
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
   FRONTEND_URL=http://localhost:3000
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5242880
   ```

4. **Seed Sample Data (Dishes, Tables, Admin & Waiter accounts)**:
   ```bash
   npm run seed
   ```
   *This populates 8 categories, 24 delicious dishes with photography, 8 dining tables with generated QR codes, an Admin user, and a Waiter account.*

5. Start the backend server:
   ```bash
   npm run dev
   # Or in production:
   npm start
   ```
   *The server starts at `http://localhost:5000`.*

---

### Step 2: Frontend Installation & Setup

1. In a separate terminal, navigate to the frontend directory:
   ```bash
   cd "HOTEL MANAGEMENT/frontend"
   ```

2. If needed:
   ```bash
   npm install
   ```

3. Ensure `.env.local` contains:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The frontend starts at `http://localhost:3000`.*

---

## 🔑 Default Seeded Accounts & Credentials

| Role | Email Address | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@spicegardenrestaurant.com` | `Admin@123` | Full control (Menu, Staff, Tables, Billing, Analytics, Settings) |
| **Waiter** | `waiter@spicegardenrestaurant.com` | `Waiter@123` | Order approvals, table status monitoring, cash payment settlement |

*(A 1-click test fill button is also provided on the `/admin/login` page for fast testing).*

---

## 🧪 Customer & Admin End-to-End Workflow Testing

### 1. Test Customer Ordering Experience
1. Open [http://localhost:3000/admin/tables](http://localhost:3000/admin/tables).
2. Choose any table (e.g., **Table 01**) and click **"Open Ordering Portal"** (or scan the QR code).
3. The customer portal opens at `/menu?table=<token>`.
4. Browse categories (Starters, Main Course, Chinese, Punjabi, Beverages).
5. Add items (e.g. *Paneer Tikka Royale*, *Old Delhi Butter Chicken*, *Kesar Mango Lassi*).
6. Go to **Cart**, add special instructions (e.g. *"Mild spicy, please"*), and tap **Place Order**.
7. The order is created with status `PENDING_APPROVAL`.

### 2. Test Waiter / Admin Order Approval
1. Open the Admin Dashboard at [http://localhost:3000/admin/orders](http://localhost:3000/admin/orders).
2. The new order appears instantly with an audible chime and notification badge.
3. Click **"Approve & Send to Kitchen"**.
4. Switch to the customer's browser tab — the status immediately updates in real-time to **"Order Confirmed"** without page reload!
5. In the Admin Orders tab, progress the order: `In Kitchen (Preparing)` → `Ready to Serve` → `Served`.

### 3. Test Multi-Round Reordering
1. On the customer tab, click **"+ Add Food"** or go back to the Menu.
2. Add desserts (e.g. *Hot Gulab Jamun with Rabdi*).
3. Place Order.
4. Go to **"Orders"** tab: Both Order #1 and Order #2 remain visible separately!
5. Open **"Bill"** tab: View the unified table running bill with calculated GST and service charge.

### 4. Test Payment Settlement
1. **Online**: Click *"Pay Online (UPI / Card)"* to trigger the Razorpay checkout.
2. **Cash**: On the Admin Tables or Billing screen, click *"Mark Cash Paid"*.
3. The customer's screen immediately turns green with *"Payment Completed! Thank you for dining with us"*.
4. Check [http://localhost:3000/admin/analytics](http://localhost:3000/admin/analytics) to see the newly collected revenue reflected in the charts.

---

## 💳 Razorpay Setup Instructions

1. Sign up for a free test account at [https://dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Navigate to **Settings** → **API Keys** → **Generate Key**.
3. Copy your `Key ID` and `Key Secret`.
4. Paste them into `backend/.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   ```
5. Paste your `Key ID` into `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
   ```
6. If credentials are not configured, the system gracefully falls back to the Cash / Pay at Counter workflow.

---

## 🏢 Multi-Restaurant SaaS Architecture

The database architecture is designed with strict tenant isolation:
- All core entities (`MenuItem`, `Category`, `Table`, `TableSession`, `Order`, `Payment`, `User`) store a mandatory `restaurant: { type: ObjectId, ref: 'Restaurant', required: true }` field.
- Database queries and Socket rooms (`restaurant-${restaurantId}`) enforce restaurant data boundaries so tenants can never view or manipulate another restaurant's records.
- New restaurants can register via `/api/auth/register` to instantly receive an isolated restaurant profile, admin credentials, default categories, and tables.

---

## 📄 License

This software is developed for commercial deployment as a white-label Smart Restaurant & Hotel SaaS application.
