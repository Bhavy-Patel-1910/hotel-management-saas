'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper';
import { paymentAPI } from '@/services/api';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  Calendar,
  RefreshCw,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const PALETTE = ['#C65D3A', '#F4B942', '#3B2118', '#248A52', '#8B5CF6', '#EC4899', '#3B82F6', '#10B981'];

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

function AnalyticsContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const { data: res } = await paymentAPI.getRevenueStats();
      setData(res.data);
    } catch {
      toast.error('Failed to load revenue analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const summary = data?.summary || {
    today: 0,
    yesterday: 0,
    thisWeek: 0,
    thisMonth: 0,
    thisYear: 0,
    lifetime: 0,
  };

  const counts = data?.orderCounts || {
    today: 0,
    yesterday: 0,
    thisWeek: 0,
    thisMonth: 0,
    thisYear: 0,
    lifetime: 0,
  };

  // Process Daily Data
  const dailyRaw = data?.charts?.last30Days || data?.charts?.daily || [];
  const dailyData = dailyRaw.map((d: any) => {
    const dateObj = new Date(d._id);
    return {
      date: isNaN(dateObj.getTime()) ? d._id : dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      revenue: Math.round(d.revenue || 0),
      orders: d.orders || 0,
    };
  });

  // Process Monthly Data
  const monthlyRaw = data?.charts?.monthlyRevenue || data?.charts?.monthly || [];
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const found = monthlyRaw.find((m: any) => (m._id?.month || m._id) === i + 1);
    return {
      month: MONTH_NAMES[i],
      revenue: Math.round(found?.revenue || 0),
      orders: found?.orders || 0,
    };
  });

  // Process Yearly Data
  const yearlyRaw = data?.charts?.yearlyRevenue || data?.charts?.yearly || [];
  const yearlyData = yearlyRaw.map((y: any) => ({
    year: String(y._id?.year || y._id || new Date().getFullYear()),
    revenue: Math.round(y.revenue || 0),
    orders: y.orders || 0,
  }));

  const pieData = monthlyData.filter((m) => m.revenue > 0);

  const cards = [
    { label: "Today's Revenue", value: summary.today, count: counts.today, period: 'vs yesterday' },
    { label: "Yesterday's Revenue", value: summary.yesterday, count: counts.yesterday, period: 'completed day' },
    { label: 'Current Week', value: summary.thisWeek, count: counts.thisWeek, period: 'last 7 days' },
    { label: 'Current Month', value: summary.thisMonth, count: counts.thisMonth, period: 'this calendar month' },
    { label: 'Current Year', value: summary.thisYear, count: counts.thisYear, period: 'YTD revenue' },
    { label: 'Total Lifetime Revenue', value: summary.lifetime, count: counts.lifetime, period: 'all-time settled' },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Revenue Analytics & Audits
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
              Verified Paid Only
            </span>
          </div>
          <p className="text-xs sm:text-sm text-textPrimary/70 mt-1">
            Audited financial breakdown derived strictly from paid customer settlements (unpaid & rejected excluded)
          </p>
        </div>

        <button
          onClick={() => fetchStats()}
          disabled={refreshing}
          className="btn-outline flex items-center gap-2 text-xs py-2.5 px-4 bg-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 mb-8">
        {cards.map((c, i) => (
          <div key={i} className="card p-4 sm:p-5 border border-primary/5 hover:border-secondary/30 transition-all">
            <div className="text-xs font-semibold text-textPrimary/60 mb-1">{c.label}</div>
            <div className="text-xl sm:text-3xl font-black text-primary tracking-tight">
              ₹{safeNumber(c.value).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-[11px] text-textPrimary/50">
              <span>{safeNumber(c.count)} paid order{safeNumber(c.count) !== 1 ? 's' : ''}</span>
              <span className="capitalize">{c.period}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Revenue Area Chart */}
      <div className="card p-5 sm:p-6 mb-8 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-secondary" />
              Daily Revenue Trend (Last 30 Days)
            </h2>
            <p className="text-xs text-textPrimary/60">Daily settled customer bills</p>
          </div>
        </div>

        <div className="h-72 w-full">
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="areaRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C65D3A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#C65D3A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip
                  formatter={(val: any) => [`₹${val.toLocaleString()}`, 'Revenue']}
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
                  fill="url(#areaRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <BarChart3 className="w-12 h-12 mb-2 stroke-1" />
              <p className="text-sm">No paid orders recorded yet in past 30 days</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly & Distribution Grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Bar Chart */}
        <div className="card p-5 sm:p-6 shadow-xs">
          <h2 className="text-base sm:text-lg font-bold text-primary mb-1">
            Monthly Revenue Breakdown ({new Date().getFullYear()})
          </h2>
          <p className="text-xs text-textPrimary/60 mb-4">Month-by-month performance across the current year</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip
                  formatter={(val: any) => [`₹${val.toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#3B2118',
                    color: '#FFF8EE',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" fill="#F4B942" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Distribution Chart */}
        <div className="card p-5 sm:p-6 shadow-xs">
          <h2 className="text-base sm:text-lg font-bold text-primary mb-1">
            Month-Wise Share Distribution
          </h2>
          <p className="text-xs text-textPrimary/60 mb-4">Percentage contribution per active month</p>

          <div className="h-64 w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={45}
                    paddingAngle={4}
                    dataKey="revenue"
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`₹${val.toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#3B2118',
                      color: '#FFF8EE',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <PieChartIcon className="w-12 h-12 mb-2 stroke-1" />
                <p className="text-sm">No revenue data yet for distribution</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Yearly Revenue Comparison */}
      {yearlyData.length > 0 && (
        <div className="card p-5 sm:p-6 shadow-xs">
          <h2 className="text-base sm:text-lg font-bold text-primary mb-1">
            Year-Over-Year Total Performance
          </h2>
          <p className="text-xs text-textPrimary/60 mb-4">Historical comparison of yearly collections</p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip
                  formatter={(val: any) => [`₹${val.toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#3B2118',
                    color: '#FFF8EE',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" fill="#3B2118" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <AdminLayoutWrapper>
      <AnalyticsContent />
    </AdminLayoutWrapper>
  );
}
