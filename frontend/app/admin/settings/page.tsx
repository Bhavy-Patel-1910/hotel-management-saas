'use client';

import { useEffect, useState } from 'react';
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper';
import { restaurantAPI, authAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import {
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  Building,
  Percent,
  Users,
  Shield,
  Upload,
  Check,
  Lock,
} from 'lucide-react';

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');

function SettingsContent() {
  const { restaurant, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'restaurant' | 'tax' | 'staff' | 'security'>('restaurant');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Restaurant details
  const [restData, setRestData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    gstPercentage: 5,
    serviceCharge: 2,
    openingTime: '10:00',
    closingTime: '23:30',
    requireOrderApproval: true,
    allowCashPayment: true,
    allowOnlinePayment: true,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  // Staff management
  const [staffList, setStaffList] = useState<any[]>([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'waiter',
    phone: '',
  });

  // Security password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [rRes, sRes] = await Promise.all([
          restaurantAPI.getRestaurant(),
          restaurantAPI.getStaff(),
        ]);
        const r = rRes.data.data;
        if (r) {
          setRestData({
            name: r.name || '',
            phone: r.phone || '',
            address: r.address || '',
            city: r.city || '',
            state: r.state || '',
            pincode: r.pincode || '',
            gstNumber: r.gstNumber || '',
            gstPercentage: r.gstPercentage ?? 5,
            serviceCharge: r.serviceCharge ?? 2,
            openingTime: r.openingTime || '10:00',
            closingTime: r.closingTime || '23:30',
            requireOrderApproval: r.settings?.requireOrderApproval ?? true,
            allowCashPayment: r.settings?.allowCashPayment ?? true,
            allowOnlinePayment: r.settings?.allowOnlinePayment ?? true,
          });

          if (r.logo) {
            setLogoPreview(r.logo.startsWith('http') ? r.logo : `${API_ROOT}${r.logo}`);
          }
        }
        setStaffList(sRes.data.data || []);
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', restData.name);
      fd.append('phone', restData.phone);
      fd.append('address', restData.address);
      fd.append('city', restData.city);
      fd.append('state', restData.state);
      fd.append('pincode', restData.pincode);
      fd.append('gstNumber', restData.gstNumber);
      fd.append('gstPercentage', String(restData.gstPercentage));
      fd.append('serviceCharge', String(restData.serviceCharge));
      fd.append('openingTime', restData.openingTime);
      fd.append('closingTime', restData.closingTime);
      fd.append('settings[requireOrderApproval]', String(restData.requireOrderApproval));
      fd.append('settings[allowCashPayment]', String(restData.allowCashPayment));
      fd.append('settings[allowOnlinePayment]', String(restData.allowOnlinePayment));

      if (logoFile) {
        fd.append('logo', logoFile);
      }

      await restaurantAPI.updateRestaurant(fd);
      toast.success('Restaurant settings saved!');
      refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await restaurantAPI.createStaff(staffForm);
      toast.success(`Staff member "${staffForm.name}" created`);
      setShowStaffModal(false);
      setStaffForm({ name: '', email: '', password: '', role: 'waiter', phone: '' });
      const { data } = await restaurantAPI.getStaff();
      setStaffList(data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create staff');
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this staff account?')) return;
    try {
      await restaurantAPI.deleteStaff(id);
      toast.success('Staff account deactivated');
      setStaffList((prev) => prev.filter((s) => s._id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'restaurant', label: 'Restaurant Profile', icon: Building },
    { id: 'tax', label: 'GST & Charges', icon: Percent },
    { id: 'staff', label: 'Staff & Roles', icon: Users },
    { id: 'security', label: 'Admin Security', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="flex-1 p-8 animate-pulse">
        <div className="h-8 w-48 bg-cream rounded-xl mb-6" />
        <div className="h-96 bg-white/60 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
          Hotel & SaaS Settings
        </h1>
        <p className="text-xs sm:text-sm text-textPrimary/70 mt-1">
          Configure branding, billing rules, GST percentages, staff logins, and access permissions
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${
                active
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-textPrimary/70 border border-primary/10 hover:bg-primary/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Restaurant Profile */}
      {activeTab === 'restaurant' && (
        <form onSubmit={handleSaveRestaurant} className="card p-6 max-w-2xl shadow-xs space-y-5">
          <h2 className="text-base sm:text-lg font-bold text-primary pb-3 border-b border-gray-100">
            Restaurant Identity & Operating Hours
          </h2>

          {/* Logo Picker */}
          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
              Restaurant Logo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-cream border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setLogoFile(f);
                      setLogoPreview(URL.createObjectURL(f));
                    }
                  }}
                  className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white"
                />
                <p className="text-[11px] text-textPrimary/50 mt-1">
                  Square image (PNG, JPG or SVG). Displayed on customer table ordering banner.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                Restaurant Name *
              </label>
              <input
                type="text"
                value={restData.name}
                onChange={(e) => setRestData((p) => ({ ...p, name: e.target.value }))}
                className="input-field text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                value={restData.phone}
                onChange={(e) => setRestData((p) => ({ ...p, phone: e.target.value }))}
                className="input-field text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
              Physical Address
            </label>
            <input
              type="text"
              value={restData.address}
              onChange={(e) => setRestData((p) => ({ ...p, address: e.target.value }))}
              placeholder="Building, street name..."
              className="input-field text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                City
              </label>
              <input
                type="text"
                value={restData.city}
                onChange={(e) => setRestData((p) => ({ ...p, city: e.target.value }))}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                State
              </label>
              <input
                type="text"
                value={restData.state}
                onChange={(e) => setRestData((p) => ({ ...p, state: e.target.value }))}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                PIN Code
              </label>
              <input
                type="text"
                value={restData.pincode}
                onChange={(e) => setRestData((p) => ({ ...p, pincode: e.target.value }))}
                className="input-field text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                Opening Time
              </label>
              <input
                type="time"
                value={restData.openingTime}
                onChange={(e) => setRestData((p) => ({ ...p, openingTime: e.target.value }))}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                Closing Time
              </label>
              <input
                type="time"
                value={restData.closingTime}
                onChange={(e) => setRestData((p) => ({ ...p, closingTime: e.target.value }))}
                className="input-field text-sm"
              />
            </div>
          </div>

          {/* Operational Policy Toggles */}
          <div className="pt-2 border-t border-gray-100 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-primary">
              <input
                type="checkbox"
                checked={restData.requireOrderApproval}
                onChange={(e) =>
                  setRestData((p) => ({ ...p, requireOrderApproval: e.target.checked }))
                }
                className="w-4 h-4 accent-secondary rounded"
              />
              <span>Require Waiter/Staff Approval Before Sending Orders to Kitchen</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-primary">
              <input
                type="checkbox"
                checked={restData.allowCashPayment}
                onChange={(e) => setRestData((p) => ({ ...p, allowCashPayment: e.target.checked }))}
                className="w-4 h-4 accent-secondary rounded"
              />
              <span>Allow "Pay at Counter / Cash to Waiter" Option</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-primary">
              <input
                type="checkbox"
                checked={restData.allowOnlinePayment}
                onChange={(e) =>
                  setRestData((p) => ({ ...p, allowOnlinePayment: e.target.checked }))
                }
                className="w-4 h-4 accent-secondary rounded"
              />
              <span>Allow Direct Online UPI / Card Checkout (Razorpay)</span>
            </label>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 text-xs py-3 px-6 shadow-md"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: GST & Charges */}
      {activeTab === 'tax' && (
        <form onSubmit={handleSaveRestaurant} className="card p-6 max-w-lg shadow-xs space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-primary pb-3 border-b border-gray-100">
            Taxation & Service Charges Configuration
          </h2>

          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
              GST Number (GSTIN)
            </label>
            <input
              type="text"
              value={restData.gstNumber}
              onChange={(e) => setRestData((p) => ({ ...p, gstNumber: e.target.value }))}
              placeholder="29ABCDE1234F1Z5"
              className="input-field text-sm font-mono uppercase"
            />
            <p className="text-[11px] text-textPrimary/50 mt-1">Printed on diner receipts</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                GST Percentage (%)
              </label>
              <input
                type="number"
                value={restData.gstPercentage}
                onChange={(e) =>
                  setRestData((p) => ({ ...p, gstPercentage: parseFloat(e.target.value) || 0 }))
                }
                min="0"
                max="28"
                step="0.5"
                className="input-field text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                Service Charge (%)
              </label>
              <input
                type="number"
                value={restData.serviceCharge}
                onChange={(e) =>
                  setRestData((p) => ({ ...p, serviceCharge: parseFloat(e.target.value) || 0 }))
                }
                min="0"
                max="20"
                step="0.5"
                className="input-field text-sm"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 text-xs py-3 px-6 shadow-md"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Update Tax Rules'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Staff & Accounts */}
      {activeTab === 'staff' && (
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-primary">
              Restaurant Staff & Waiter Accounts
            </h2>
            <button
              onClick={() => setShowStaffModal(true)}
              className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Staff
            </button>
          </div>

          <div className="grid gap-3">
            {staffList.map((s) => (
              <div
                key={s._id}
                className="card p-4 flex items-center justify-between border border-primary/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-sm">
                    {s.name ? s.name[0]?.toUpperCase() : 'S'}
                  </div>
                  <div>
                    <h4 className="font-bold text-primary text-sm">{s.name}</h4>
                    <p className="text-xs text-textPrimary/60">
                      {s.email} • <span className="capitalize font-semibold text-secondary">{s.role}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      s.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleDeleteStaff(s._id)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                    title="Remove Staff"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Staff Modal */}
          {showStaffModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                  <h3 className="font-bold text-primary text-lg">Add New Staff Member</h3>
                  <button
                    onClick={() => setShowStaffModal(false)}
                    className="text-gray-400 hover:text-primary"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddStaff} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={staffForm.name}
                      onChange={(e) => setStaffForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Ramesh Patel"
                      className="input-field text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="waiter@restaurant.com"
                      className="input-field text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={staffForm.password}
                      onChange={(e) => setStaffForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                      className="input-field text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                      Role / Department
                    </label>
                    <select
                      value={staffForm.role}
                      onChange={(e) => setStaffForm((p) => ({ ...p, role: e.target.value }))}
                      className="input-field text-sm"
                    >
                      <option value="waiter">Waiter (Order Approvals & Table Assist)</option>
                      <option value="kitchen">Kitchen Staff (Food Preparation)</option>
                      <option value="manager">Manager (Menu & Operations)</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowStaffModal(false)}
                      className="btn-outline flex-1 text-xs py-3"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1 text-xs py-3 flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Create Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Security Password Change */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="card p-6 max-w-md shadow-xs space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-primary pb-3 border-b border-gray-100">
            Change Administrator Password
          </h2>

          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
              Current Password *
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
              }
              className="input-field text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
              New Password *
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
              }
              className="input-field text-sm"
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
              Confirm New Password *
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
              }
              className="input-field text-sm"
              placeholder="Repeat new password"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1"
            >
              {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPasswords ? 'Hide passwords' : 'Show passwords'}
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 text-xs py-3 px-6 shadow-md"
            >
              <Lock className="w-4 h-4" />
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AdminLayoutWrapper>
      <SettingsContent />
    </AdminLayoutWrapper>
  );
}
