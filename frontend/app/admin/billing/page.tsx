'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper';
import { paymentAPI } from '@/services/api';
import toast from 'react-hot-toast';
import {
  Search,
  RefreshCw,
  CreditCard,
  Banknote,
  Eye,
  Printer,
  X,
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const statusConfig: Record<string, { label: string; badge: string }> = {
  paid: { label: 'Paid', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  unpaid: { label: 'Unpaid', badge: 'bg-red-100 text-red-800 border-red-300' },
  pending: { label: 'Pending', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
  failed: { label: 'Failed', badge: 'bg-gray-100 text-gray-700 border-gray-300' },
  refunded: { label: 'Refunded', badge: 'bg-blue-100 text-blue-800 border-blue-300' },
};

function BillingContent() {
  const { restaurant } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const params: any = { limit: 100 };
      if (statusFilter) params.paymentStatus = statusFilter;
      if (search) params.billNumber = search;
      const { data } = await paymentAPI.getPayments(params);
      setPayments(data.data || []);
    } catch {
      toast.error('Failed to load billing history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const printReceipt = (bill: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt: ${bill.billNumber}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 320px;
              margin: 20px auto;
              color: #000;
              line-height: 1.4;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .double-divider { border-top: 2px dashed #000; margin: 10px 0; }
            .flex { display: flex; justify-content: space-between; }
            h2 { margin: 0; font-size: 18px; }
            p { margin: 2px 0; font-size: 12px; }
            table { width: 100%; font-size: 12px; border-collapse: collapse; }
            th { text-align: left; border-bottom: 1px solid #000; }
            td { padding: 3px 0; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2>${restaurant?.name || 'Spice Garden Hotel'}</h2>
            <p>${restaurant?.address || 'Brigade Road, Ashok Nagar'}</p>
            <p>${restaurant?.phone || '+91 98765 43210'}</p>
            ${restaurant?.gstNumber ? `<p>GSTIN: ${restaurant.gstNumber}</p>` : ''}
          </div>
          <div class="divider"></div>
          <div class="flex"><p>Bill No: <b>${bill.billNumber}</b></p></div>
          <div class="flex">
            <p>Date: ${new Date(bill.createdAt).toLocaleDateString('en-IN')}</p>
            <p>Time: ${new Date(bill.createdAt).toLocaleTimeString('en-IN')}</p>
          </div>
          <div class="flex">
            <p>Method: ${bill.paymentMethod?.toUpperCase()}</p>
            <p>Status: ${bill.paymentStatus?.toUpperCase()}</p>
          </div>
          <div class="divider"></div>
          <div class="flex"><p>Subtotal:</p><p class="bold">₹${bill.subtotal?.toFixed(2)}</p></div>
          ${bill.gstAmount > 0 ? `<div class="flex"><p>GST (${restaurant?.gstPercentage || 5}%):</p><p>₹${bill.gstAmount?.toFixed(2)}</p></div>` : ''}
          ${bill.serviceCharge > 0 ? `<div class="flex"><p>Service Charge (${restaurant?.serviceCharge || 0}%):</p><p>₹${bill.serviceCharge?.toFixed(2)}</p></div>` : ''}
          <div class="double-divider"></div>
          <div class="flex" style="font-size: 16px;">
            <p class="bold">GRAND TOTAL:</p>
            <p class="bold">₹${bill.totalAmount?.toFixed(2)}</p>
          </div>
          <div class="divider"></div>
          <div class="center">
            <p class="bold">Thank you for dining with us!</p>
            <p>Please visit again.</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            Billing & Invoices
          </h1>
          <p className="text-xs sm:text-sm text-textPrimary/70 mt-1">
            Complete transaction records, receipts, and customer payment histories
          </p>
        </div>
        <button
          onClick={() => fetchPayments()}
          disabled={refreshing}
          className="btn-outline flex items-center gap-2 text-xs py-2.5 px-4 bg-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Bill Number (e.g. BILL-)..."
            className="input-field pl-10 text-xs sm:text-sm py-2.5"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field text-xs sm:text-sm py-2.5 w-auto"
        >
          <option value="">All Payment Statuses</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Bills Table */}
      <div className="card overflow-hidden shadow-xs border border-primary/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-cream/80 border-b border-gray-100 text-primary font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-4">Bill Number</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4 text-right">Subtotal</th>
                <th className="p-4 text-right">Taxes & Charges</th>
                <th className="p-4 text-right">Total Amount</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="p-4">
                      <div className="h-6 bg-cream rounded-md" />
                    </td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-textPrimary/60">
                    <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-sm">No billing records found</p>
                    <p className="text-xs">Bills will appear automatically as orders are placed and settled.</p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const sc = statusConfig[p.paymentStatus] || statusConfig.unpaid;
                  return (
                    <tr key={p._id} className="hover:bg-cream/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-primary">
                        {p.billNumber}
                      </td>
                      <td className="p-4 text-textPrimary/70">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 font-medium capitalize">
                          {p.paymentMethod === 'cash' ? (
                            <Banknote className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <CreditCard className="w-4 h-4 text-secondary" />
                          )}
                          {p.paymentMethod || 'cash'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono">₹{p.subtotal?.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono text-textPrimary/60">
                        ₹{((p.gstAmount || 0) + (p.serviceCharge || 0)).toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-mono font-black text-secondary text-base">
                        ₹{p.totalAmount?.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full border ${sc.badge}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setSelectedBill(p)}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-all"
                            title="View Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => printReceipt(p)}
                            className="p-1.5 rounded-lg text-secondary hover:bg-secondary/10 transition-all"
                            title="Print Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill View Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                  Official Invoice
                </span>
                <h3 className="font-extrabold text-primary text-lg">
                  {selectedBill.billNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="text-gray-400 hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-6">
              <div className="flex justify-between">
                <span className="text-textPrimary/60">Restaurant</span>
                <span className="font-bold text-primary">{restaurant?.name || 'Restaurant'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textPrimary/60">Date & Time</span>
                <span className="font-medium text-primary">
                  {new Date(selectedBill.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-textPrimary/60">Payment Method</span>
                <span className="font-bold uppercase text-primary">
                  {selectedBill.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-textPrimary/60">Payment Status</span>
                <span className="font-bold uppercase text-emerald-700">
                  {selectedBill.paymentStatus}
                </span>
              </div>

              {selectedBill.razorpayPaymentId && (
                <div className="flex justify-between">
                  <span className="text-textPrimary/60">Razorpay Trans ID</span>
                  <span className="font-mono text-primary">{selectedBill.razorpayPaymentId}</span>
                </div>
              )}

              <div className="pt-3 border-t border-dashed border-gray-200 space-y-1.5">
                <div className="flex justify-between">
                  <span>Food Subtotal:</span>
                  <span className="font-mono">₹{selectedBill.subtotal?.toFixed(2)}</span>
                </div>
                {selectedBill.gstAmount > 0 && (
                  <div className="flex justify-between">
                    <span>GST:</span>
                    <span className="font-mono">₹{selectedBill.gstAmount?.toFixed(2)}</span>
                  </div>
                )}
                {selectedBill.serviceCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Service Charge:</span>
                    <span className="font-mono">₹{selectedBill.serviceCharge?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-primary pt-2 border-t">
                  <span>Grand Total:</span>
                  <span className="text-secondary font-mono">₹{selectedBill.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedBill(null)}
                className="btn-outline flex-1 text-xs py-2.5"
              >
                Close
              </button>
              <button
                onClick={() => printReceipt(selectedBill)}
                className="btn-primary flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <AdminLayoutWrapper>
      <BillingContent />
    </AdminLayoutWrapper>
  );
}
