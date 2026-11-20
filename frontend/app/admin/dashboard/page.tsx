'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper';
import { orderAPI, paymentAPI } from '@/services/api';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  CreditCard,
  ChefHat,
  ArrowUpRight,
  BarChart3,
} from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import Link from 'next/link';

interface Stats {
  totalOrdersToday: number;
  pendingOrders: number;
  completedOrdersToday: number;
  activeTablesCount: number;
}

interface RevenueStats {
  summary: {
    today: any;
    yesterday: any;
    thisWeek: any;
    thisMonth: any;
    thisYear: any;
    lifetime: any;
  };
  charts: {
    last30Days?: Array<{ _id: string; revenue: number; orders: number }>;
    daily?: Array<{ _id: string; revenue: number; orders: number }>;
  };
}

const safeNumber = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'object' && val.total !== undefined) {
    const num = Number(val.total);
    return isNaN(num) ? 0 : num;
  }
  const parsed = Number(val);
  return isNaN(parsed) ? 0 : parsed;
};

function DashboardContent() {
  const { user, restaurant } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [statsRes, revRes, ordersRes] = await Promise.all([
        orderAPI.getOrderStats(),
        paymentAPI.getRevenueStats(),
        orderAPI.getOrders({ limit: 6, status: 'pending_approval' }),
      ]);
      setStats(statsRes.data.data);
      setRevenue(revRes.data.data);
      setPendingOrders(ordersRes.data.data);
    } catch (err) {
      console.error('Error fetching dashboard metrics', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Socket.io real-time connection
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
    });

    socket.on('connect', () => {
      if (restaurant?._id) {
        socket.emit('join-restaurant', restaurant._id);
      }
    });

    socket.on('new-order', (data: any) => {
      toast.success(
        `🛎️ New Order placed for ${data?.order?.table?.displayName || 'a table'} (₹${data?.order?.totalAmount || 0})!`,
        { duration: 6000 }
      );
      fetchData(true);
    });

    socket.on('order-updated', () => {
      fetchData(true);
    });

    socket.on('payment-received', (data: any) => {
      toast.success(`💰 Payment received: ₹${data?.payment?.totalAmount || ''}!`);
      fetchData(true);
    });

    return () => {
      socket.disconnect();
    };
  }, [restaurant, fetchData]);

  // Safe formatting without any `[object Object]`
  const todayRev = safeNumber(revenue?.summary?.today);
  const weekRev = safeNumber(revenue?.summary?.thisWeek);
  const monthRev = safeNumber(revenue?.summary?.thisMonth);
  const rawChartData = revenue?.charts?.last30Days || revenue?.charts?.daily || [];

  const chartData = rawChartData.slice(-10).map((d: any) => {
    const dateStr = d._id || '';
    const dateObj = new Date(dateStr);
    return {
      date: isNaN(dateObj.getTime()) ? dateStr : dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      revenue: Math.round(d.revenue || 0),
      orders: d.orders || 0,
    };
  });

  const cards = [
    {
      label: "Today's Revenue",
      value: `₹${todayRev.toLocaleString('en-IN')}`,
      change: `This month: ₹${monthRev.toLocaleString('en-IN')}`,
      icon: TrendingUp,
      bgColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
      iconBg: 'bg-emerald-600 text-white',
    },
    {
      label: 'Orders Today',
      value: stats?.totalOrdersToday ?? 0,
      change: 'Orders recorded',
      icon: ShoppingBag,
      bgColor: 'bg-secondary/10 text-secondary border-secondary/20',
      iconBg: 'bg-secondary text-white',
    },
    {
      label: 'Pending Approval',
      value: stats?.pendingOrders ?? 0,
      change: 'Requires waiter confirmation',
      icon: Clock,
      bgColor: (stats?.pendingOrders ?? 0) > 0 ? 'bg-amber-500/10 text-amber-800 border-amber-500/30' : 'bg-gray-100 text-gray-700 border-gray-200',
      iconBg: (stats?.pendingOrders ?? 0) > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-gray-400 text-white',
    },
    {
      label: 'Active Tables',
      value: stats?.activeTablesCount ?? 0,
      change: 'Guests currently dining',
      icon: Users,
      bgColor: 'bg-primary/10 text-primary border-primary/20',
      iconBg: 'bg-primary text-white',
    },
    {
      label: 'Completed Today',
      value: stats?.completedOrdersToday ?? 0,
      change: 'Served & finalized',
      icon: CheckCircle,
      bgColor: 'bg-blue-500/10 text-blue-800 border-blue-500/20',
      iconBg: 'bg-blue-600 text-white',
    },
    {
      label: 'Weekly Revenue',
      value: `₹${weekRev.toLocaleString('en-IN')}`,
      change: 'Current 7-day total',
      icon: CreditCard,
      bgColor: 'bg-purple-500/10 text-purple-800 border-purple-500/20',
      iconBg: 'bg-purple-600 text-white',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Admin'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-textPrimary/70 mt-1">
            Real-time management dashboard for <span className="font-semibold text-primary">{restaurant?.name || 'Restaurant'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData()}
            disabled={refreshing}
            className="btn-outline flex items-center gap-2 text-xs py-2.5 px-4 bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <Link
            href="/admin/orders"
            className="btn-primary text-xs py-2.5 px-4 flex items-center gap-1.5"
          >
            <ChefHat className="w-3.5 h-3.5" />
            Kitchen Orders
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 mb-8">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`card p-4 sm:p-5 border ${card.bgColor} shadow-xs hover:shadow-md transition-all`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs sm:text-sm font-semibold opacity-90">{card.label}</span>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${card.iconBg} shadow-sm`}>
                <card.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-black tracking-tight">{card.value}</div>
            <p className="text-[11px] sm:text-xs opacity-75 mt-1 font-medium truncate">{card.change}</p>
          </div>
        ))}
      </div>

      {/* Main Content: Chart & Pending Orders */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart (2 cols) */}
        <div className="lg:col-span-2 card p-5 sm:p-6 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-primary">Daily Revenue Trend</h2>
              <p className="text-xs text-textPrimary/60">Paid customer orders</p>
            </div>
            <Link
              href="/admin/analytics"
              className="text-xs font-semibold text-secondary flex items-center gap-1 hover:underline"
            >
              Full Analytics <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 sm:h-72 w-full min-w-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C65D3A" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#C65D3A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <Tooltip
                    formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#3B2118',
                      color: '#FFF8EE',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#C65D3A"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <BarChart3 className="w-12 h-12 mb-2 stroke-1" />
                <p className="text-sm font-medium">No order revenue recorded yet today</p>
                <p className="text-xs">Place and pay for an order to see live analytics</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Pending Orders (1 col) */}
        <div className="card p-5 sm:p-6 shadow-sm flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <h2 className="text-base font-bold text-primary">Needs Approval</h2>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-secondary hover:underline"
            >
              View All ({pendingOrders.length})
            </Link>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] scrollbar-hide">
            {pendingOrders.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center text-gray-400">
                <CheckCircle className="w-10 h-10 mb-2 text-emerald-500/40" />
                <p className="text-sm font-medium text-textPrimary/70">All clear!</p>
                <p className="text-xs text-textPrimary/50">No pending orders awaiting approval.</p>
              </div>
            ) : (
              pendingOrders.map((ord) => (
                <div
                  key={ord._id}
                  className="p-3 rounded-xl bg-cream border border-amber-500/20 hover:border-amber-500/50 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-primary">{ord.orderNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-white font-bold">
                        {ord.table?.displayName || 'Table'}
                      </span>
                    </div>
                    <p className="text-xs text-textPrimary/70 mt-1">
                      {ord.items?.length || 0} item{(ord.items?.length || 0) > 1 ? 's' : ''} • ₹{ord.totalAmount}
                    </p>
                  </div>
                  <Link
                    href="/admin/orders"
                    className="p-2 rounded-lg bg-secondary text-white hover:bg-secondary/90 shadow-xs"
                    title="Review & Approve"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link
              href="/admin/tables"
              className="w-full btn-outline text-xs py-2 flex items-center justify-center gap-1.5"
            >
              View Active Tables & QR Codes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AdminLayoutWrapper>
      <DashboardContent />
    </AdminLayoutWrapper>
  );
}
