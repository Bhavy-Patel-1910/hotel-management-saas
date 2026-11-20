'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper';
import { tableAPI, paymentAPI } from '@/services/api';
import toast from 'react-hot-toast';
import {
  Plus,
  QrCode,
  RefreshCw,
  Download,
  Printer,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Users,
  ExternalLink,
  Banknote,
  Sparkles,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; badge: string; dot: string }> = {
  available: {
    label: 'Available',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    dot: 'bg-emerald-500',
  },
  occupied: {
    label: 'Occupied',
    badge: 'bg-blue-100 text-blue-800 border-blue-300 font-bold',
    dot: 'bg-blue-500',
  },
  waiting_payment: {
    label: 'Waiting Payment',
    badge: 'bg-amber-100 text-amber-800 border-amber-300 font-bold animate-pulse',
    dot: 'bg-amber-500',
  },
  cleaning: {
    label: 'Cleaning',
    badge: 'bg-gray-100 text-gray-700 border-gray-300 font-medium',
    dot: 'bg-gray-400',
  },
};

function TablesContent() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [qrModalTable, setQrModalTable] = useState<any>(null);
  const [cashPaySessionId, setCashPaySessionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    tableNumber: '',
    displayName: '',
    capacity: '4',
    floor: 'Ground Floor',
    section: 'Main Dining',
  });

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await tableAPI.getTables();
      setTables(data.data || []);
    } catch {
      toast.error('Failed to load restaurant tables');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const openModal = (table?: any) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        tableNumber: table.tableNumber,
        displayName: table.displayName || `Table ${table.tableNumber}`,
        capacity: (table.capacity || 4).toString(),
        floor: table.floor || 'Ground Floor',
        section: table.section || 'Main Dining',
      });
    } else {
      setEditingTable(null);
      const nextNum = String(tables.length + 1).padStart(2, '0');
      setFormData({
        tableNumber: nextNum,
        displayName: `Table ${nextNum}`,
        capacity: '4',
        floor: 'Ground Floor',
        section: 'Main Dining',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTable) {
        await tableAPI.updateTable(editingTable._id, {
          tableNumber: formData.tableNumber,
          displayName: formData.displayName,
          capacity: parseInt(formData.capacity) || 4,
          floor: formData.floor,
          section: formData.section,
        });
        toast.success(`Table ${formData.displayName} updated`);
      } else {
        await tableAPI.createTable({
          tableNumber: formData.tableNumber,
          displayName: formData.displayName,
          capacity: parseInt(formData.capacity) || 4,
          floor: formData.floor,
          section: formData.section,
        });
        toast.success(`Table ${formData.displayName} created with QR`);
      }
      setShowModal(false);
      fetchTables();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving table');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await tableAPI.deleteTable(id);
      toast.success('Table removed');
      setDeleteConfirmId(null);
      fetchTables();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleRegenerateQR = async (id: string) => {
    try {
      const { data } = await tableAPI.regenerateQR(id);
      toast.success('Regenerated new secure QR Code!');
      fetchTables();
      if (qrModalTable?._id === id) {
        setQrModalTable(data.data);
      }
    } catch {
      toast.error('Failed to regenerate QR');
    }
  };

  const downloadQR = (table: any) => {
    if (!table.qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = table.qrCodeUrl;
    a.download = `QR-${table.displayName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded QR for ${table.displayName}`);
  };

  const printQR = (table: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Table Stand: ${table.displayName}</title>
          <style>
            body {
              font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background-color: #FFF8EE;
            }
            .card {
              border: 3px solid #3B2118;
              border-radius: 24px;
              padding: 40px;
              text-align: center;
              background: #ffffff;
              max-width: 380px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            h1 {
              font-size: 28px;
              color: #3B2118;
              margin: 0 0 8px 0;
              font-weight: 800;
            }
            p.sub {
              font-size: 14px;
              color: #C65D3A;
              margin: 0 0 24px 0;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            img.qr {
              width: 250px;
              height: 250px;
              border-radius: 16px;
              border: 2px solid #FFF8EE;
            }
            .instructions {
              margin-top: 24px;
              font-size: 13px;
              color: #29221F;
              line-height: 1.5;
            }
            .step {
              font-weight: 700;
              color: #3B2118;
            }
            @media print {
              body { background: white; }
              .card { border: 2px solid #3B2118; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${table.displayName}</h1>
            <p class="sub">Scan & Order from Your Phone</p>
            <img class="qr" src="${table.qrCodeUrl}" alt="QR Code" />
            <div class="instructions">
              <span class="step">1. Open Camera or Google Lens</span><br />
              <span class="step">2. Scan QR & Browse Delicious Menu</span><br />
              <span class="step">3. Place Order & Pay at Table</span>
            </div>
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

  const handleCashPaymentReceived = async (sessionId: string) => {
    try {
      await paymentAPI.markCashPayment(sessionId);
      toast.success('Cash payment confirmed! Table status updated.');
      setCashPaySessionId(null);
      fetchTables();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error recording payment');
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            Tables & QR Codes
          </h1>
          <p className="text-xs sm:text-sm text-textPrimary/70 mt-1">
            Manage restaurant dining tables, download & print QR stands, and monitor occupancy
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTables()}
            className="btn-outline flex items-center gap-1.5 text-xs py-2.5 px-3 bg-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-2 text-xs py-2.5 px-4"
          >
            <Plus className="w-4 h-4" /> Add Table
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card h-64 bg-white/60 animate-pulse" />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="card p-12 text-center max-w-md mx-auto my-12">
          <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-primary text-base">No tables created yet</h3>
          <p className="text-xs text-textPrimary/60 mt-1">
            Click "Add Table" above to create Table 01 with an automatically generated QR code.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {tables.map((table) => {
            const sc = statusConfig[table.status] || statusConfig.available;
            const currentSession = table.currentSession;

            return (
              <div
                key={table._id}
                className="card p-5 flex flex-col justify-between border-2 border-primary/5 hover:border-secondary/40 shadow-xs hover:shadow-md transition-all"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-extrabold text-primary text-base sm:text-lg">
                        {table.displayName}
                      </h3>
                      <p className="text-xs text-textPrimary/60 font-medium">
                        {table.floor} • {table.section}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-textPrimary/70 bg-cream px-2 py-1 rounded-lg">
                      <Users className="w-3.5 h-3.5 text-secondary" />
                      <span>{table.capacity}p</span>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${sc.badge}`}>
                      {sc.label}
                    </span>
                  </div>

                  {/* QR Image Box */}
                  <div
                    onClick={() => setQrModalTable(table)}
                    className="p-3 bg-cream/70 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-cream transition-all group mb-4 border border-primary/5"
                  >
                    {table.qrCodeUrl ? (
                      <img
                        src={table.qrCodeUrl}
                        alt="QR Code"
                        className="w-28 h-28 object-contain transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-28 h-28 flex items-center justify-center text-gray-300">
                        <QrCode className="w-12 h-12" />
                      </div>
                    )}
                    <span className="text-[10px] text-secondary font-bold mt-2 flex items-center gap-1">
                      <QrCode className="w-3 h-3" /> Click to View / Enlarge
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  {/* Test in customer portal button */}
                  <a
                    href={`/menu?table=${table.qrToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn-outline text-xs py-2 flex items-center justify-center gap-1.5 bg-white text-secondary hover:text-secondary font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Ordering Portal
                  </a>

                  {/* Cash pay action if occupied / waiting payment */}
                  {(table.status === 'occupied' || table.status === 'waiting_payment') && currentSession && (
                    <button
                      onClick={() => setCashPaySessionId(currentSession._id || currentSession)}
                      className="w-full py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      Mark Cash Paid
                    </button>
                  )}

                  <div className="flex items-center justify-between gap-1 pt-1">
                    <button
                      onClick={() => downloadQR(table)}
                      className="p-2 rounded-xl text-textPrimary/70 hover:text-primary hover:bg-primary/10 transition-all"
                      title="Download PNG"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => printQR(table)}
                      className="p-2 rounded-xl text-textPrimary/70 hover:text-primary hover:bg-primary/10 transition-all"
                      title="Print Table Tent Card"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openModal(table)}
                      className="p-2 rounded-xl text-textPrimary/70 hover:text-primary hover:bg-primary/10 transition-all"
                      title="Edit Table"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRegenerateQR(table._id)}
                      className="p-2 rounded-xl text-amber-600 hover:bg-amber-50 transition-all"
                      title="Regenerate QR Token"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(table._id)}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-all"
                      title="Delete Table"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Modal (Enlarged QR Code & Print Preview) */}
      {qrModalTable && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <h3 className="font-extrabold text-primary text-lg">
                {qrModalTable.displayName}
              </h3>
              <button
                onClick={() => setQrModalTable(null)}
                className="text-gray-400 hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-cream rounded-2xl flex items-center justify-center mb-4 border border-primary/10">
              <img
                src={qrModalTable.qrCodeUrl}
                alt="Enlarged QR"
                className="w-56 h-56 object-contain"
              />
            </div>

            <p className="text-xs text-textPrimary/70 mb-5">
              Secure QR Code token: <span className="font-mono text-primary font-bold">{qrModalTable.qrToken.slice(0, 12)}...</span>
            </p>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => downloadQR(qrModalTable)}
                className="btn-outline flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
              <button
                onClick={() => printQR(qrModalTable)}
                className="btn-primary flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Stand
              </button>
            </div>

            <a
              href={`/menu?table=${qrModalTable.qrToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-secondary hover:underline inline-flex items-center gap-1 mt-2"
            >
              Simulate Customer QR Scan <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Cash Payment Confirm Modal */}
      {cashPaySessionId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto mb-3 flex items-center justify-center text-2xl font-bold">
              💵
            </div>
            <h3 className="font-bold text-primary text-base mb-1">Confirm Cash Payment</h3>
            <p className="text-xs text-textPrimary/70 mb-5">
              Did the customer pay their full bill in cash at the counter or to the waiter? This will mark the bill as PAID and free up the table.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCashPaySessionId(null)}
                className="btn-outline flex-1 text-xs py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCashPaymentReceived(cashPaySessionId)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex-1 shadow-sm"
              >
                Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Table Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <h3 className="font-bold text-primary text-lg">
                {editingTable ? 'Edit Table Details' : 'Add New Dining Table'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                    Table Number *
                  </label>
                  <input
                    type="text"
                    value={formData.tableNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tableNumber: e.target.value }))}
                    placeholder="01"
                    className="input-field text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                    Capacity (Persons)
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, capacity: e.target.value }))}
                    placeholder="4"
                    min="1"
                    className="input-field text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
                  placeholder="e.g. Table 01 or VIP Booth"
                  className="input-field text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                    Floor Level
                  </label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => setFormData((prev) => ({ ...prev, floor: e.target.value }))}
                    placeholder="Ground Floor"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                    Dining Section
                  </label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData((prev) => ({ ...prev, section: e.target.value }))}
                    placeholder="Main Dining, Patio, Rooftop"
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-outline flex-1 text-xs py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 text-xs py-3 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {saving ? 'Saving...' : editingTable ? 'Save Changes' : 'Generate Table & QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger mx-auto mb-3 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-primary text-base mb-1">Delete Table?</h3>
            <p className="text-xs text-textPrimary/70 mb-5">
              This will deactivate this table. Past bills and orders remain safely archived.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn-outline flex-1 text-xs py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2.5 rounded-xl bg-danger text-white text-xs font-bold hover:bg-danger/90 flex-1"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TablesPage() {
  return (
    <AdminLayoutWrapper>
      <TablesContent />
    </AdminLayoutWrapper>
  );
}
