'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper';
import { orderAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Bell,
  RefreshCw,
  Eye,
  AlertTriangle,
  Utensils,
  Check,
  X,
  Filter,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; badgeClass: string; cardBorder: string; next?: string[] }> = {
  pending_approval: {
    label: 'Pending Approval',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold animate-pulse',
    cardBorder: 'border-amber-400 shadow-md shadow-amber-500/10',
    next: ['confirmed', 'rejected'],
  },
  confirmed: {
    label: 'Confirmed',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200 font-semibold',
    cardBorder: 'border-blue-200',
    next: ['preparing'],
  },
  preparing: {
    label: 'In Kitchen (Preparing)',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200 font-semibold',
    cardBorder: 'border-orange-200',
    next: ['ready'],
  },
  ready: {
    label: 'Ready to Serve',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    cardBorder: 'border-emerald-300',
    next: ['served'],
  },
  served: {
    label: 'Served to Table',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200 font-semibold',
    cardBorder: 'border-purple-200',
    next: ['completed'],
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300 font-medium',
    cardBorder: 'border-gray-200 opacity-90',
  },
  rejected: {
    label: 'Rejected',
    badgeClass: 'bg-red-100 text-red-800 border-red-200 font-medium',
    cardBorder: 'border-red-200 opacity-80',
  },
};

function OrderCard({ order, onUpdate }: { order: any; onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [expanded, setExpanded] = useState(false);

  const cfg = statusConfig[order.status] || statusConfig.pending_approval;

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    setLoading(true);
    try {
      await orderAPI.updateOrderStatus(order._id, {
        status: newStatus,
        rejectionReason: reason,
      });
      toast.success(`Order ${order.orderNumber} updated to ${statusConfig[newStatus]?.label || newStatus}`);
      setShowRejectModal(false);
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const timeFormatted = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`card overflow-hidden border-2 transition-all ${cfg.cardBorder}`}>
      {/* Top Warning Banner for Pending Approval */}
      {order.status === 'pending_approval' && (
        <div className="bg-amber-400 text-amber-950 px-4 py-1.5 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 animate-bounce" />
            <span>NEEDS WAITER APPROVAL</span>
          </div>
          <span className="text-[11px] font-mono">{timeFormatted}</span>
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Header: Table & Order Number */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-primary text-base sm:text-lg">
                {order.table?.displayName || `Table ${order.table?.tableNumber || ''}`}
              </span>
              <span className="text-xs font-mono font-medium text-textPrimary/60">
                #{order.orderNumber}
              </span>
            </div>
            <span className="text-xs text-textPrimary/50 font-medium">Placed at {timeFormatted}</span>
          </div>

          <span className={`text-[11px] px-2.5 py-1 rounded-full border ${cfg.badgeClass}`}>
            {cfg.label}
          </span>
        </div>

        {/* Items List */}
        <div className="bg-cream/60 rounded-xl p-3 mb-3 border border-primary/5">
          <div className="space-y-1.5 text-xs sm:text-sm">
            {(expanded ? order.items : order.items?.slice(0, 3))?.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <span className="font-semibold text-primary">
                  {item.quantity} × {item.name}
                </span>
                <span className="text-textPrimary/70 font-mono">₹{item.subtotal || item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          {order.items?.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-secondary font-bold text-xs mt-2 flex items-center gap-1 hover:underline"
            >
              <Eye className="w-3 h-3" />
              {expanded ? 'Show Less' : `+${order.items.length - 3} more items`}
            </button>
          )}

          {order.specialInstructions && (
            <div className="mt-2.5 pt-2 border-t border-amber-950/10 text-xs">
              <span className="font-bold text-secondary">Note from Diner: </span>
              <span className="text-primary italic">"{order.specialInstructions}"</span>
            </div>
          )}
        </div>

        {/* Bill Breakdown */}
        <div className="flex items-center justify-between pt-1 mb-4 text-xs font-medium text-textPrimary/70 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Subtotal: ₹{order.subtotal}</span>
            {order.gstAmount > 0 && <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">GST: +₹{order.gstAmount}</span>}
            {order.serviceCharge > 0 && <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">Service: +₹{order.serviceCharge}</span>}
          </div>
          <div className="text-right">
            <span className="text-xs text-textPrimary/50 mr-1.5 font-normal">Total:</span>
            <span className="font-black text-secondary text-base sm:text-lg">₹{order.totalAmount}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2 flex-wrap">
          {/* Initial Approval Buttons */}
          {order.status === 'pending_approval' && (
            <>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-all flex items-center gap-1 active:scale-95"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>

              <button
                onClick={() => handleStatusChange('confirmed')}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-sm active:scale-95"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Approve & Send to Kitchen
              </button>
            </>
          )}

          {/* Kitchen / Serving Lifecycle Buttons */}
          {order.status === 'confirmed' && (
            <button
              onClick={() => handleStatusChange('preparing')}
              disabled={loading}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <ChefHat className="w-3.5 h-3.5" />
              Start Preparing
            </button>
          )}

          {order.status === 'preparing' && (
            <button
              onClick={() => handleStatusChange('ready')}
              disabled={loading}
              className="btn-accent text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              Mark Ready to Serve
            </button>
          )}

          {order.status === 'ready' && (
            <button
              onClick={() => handleStatusChange('served')}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-all flex items-center gap-1 shadow-sm"
            >
              <Utensils className="w-3.5 h-3.5" />
              Mark as Served
            </button>
          )}

          {order.status === 'served' && (
            <button
              onClick={() => handleStatusChange('completed')}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-gray-700 text-white text-xs font-bold hover:bg-gray-800 transition-all flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Finalize Order
            </button>
          )}
        </div>
      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-2 text-danger font-bold text-base mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Reject Order #{order.orderNumber}?</span>
            </div>
            <p className="text-xs text-textPrimary/70 mb-4">
              Enter reason for rejection (e.g. "Item out of stock", "Kitchen closing"). The customer will be informed immediately.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Butter Chicken is currently sold out."
              className="input-field text-xs mb-4"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="btn-outline flex-1 text-xs py-2.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('rejected', rejectionReason || 'Item unavailable')}
                className="px-4 py-2.5 rounded-xl bg-danger text-white text-xs font-bold hover:bg-danger/90 flex-1"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrdersContent() {
  const { restaurant } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const params: any = { limit: 100 };
      if (filter !== 'all') {
        params.status = filter;
      }
      const { data } = await orderAPI.getOrders(params);
      setOrders(data.data || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time updates from WebSocket
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
    });

    socket.on('connect', () => {
      if (restaurant?._id) {
        socket.emit('join-restaurant', restaurant._id);
      }
    });

    socket.on('new-order', () => {
      fetchOrders(true);
    });

    socket.on('order-updated', () => {
      fetchOrders(true);
    });

    return () => {
      socket.disconnect();
    };
  }, [restaurant, fetchOrders]);

  const filterTabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending_approval', label: 'Pending Approval' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'preparing', label: 'In Kitchen' },
    { id: 'ready', label: 'Ready' },
    { id: 'served', label: 'Served' },
    { id: 'completed', label: 'Completed' },
    { id: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            Live Order Management
          </h1>
          <p className="text-xs sm:text-sm text-textPrimary/70 mt-1">
            Real-time kitchen order dispatch and table approvals
          </p>
        </div>
        <button
          onClick={() => fetchOrders()}
          disabled={refreshing}
          className="btn-outline flex items-center gap-2 text-xs py-2.5 px-4 bg-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {filterTabs.map((t) => {
          const active = filter === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                active
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-textPrimary/70 border border-primary/10 hover:bg-primary/5'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Order Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-52 bg-white/50 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center max-w-md mx-auto my-12">
          <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-primary text-base">No orders in this view</h3>
          <p className="text-xs text-textPrimary/60 mt-1">
            Orders placed by diners via table QR codes will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} onUpdate={() => fetchOrders(true)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <AdminLayoutWrapper>
      <OrdersContent />
    </AdminLayoutWrapper>
  );
}
