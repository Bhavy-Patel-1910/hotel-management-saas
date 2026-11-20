'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper';
import { menuAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Tag, X, Check, AlertTriangle, ArrowUpDown, RefreshCw } from 'lucide-react';

function CategoriesContent() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: '1',
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await menuAPI.getCategories();
      setCategories(data.data || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openModal = (cat?: any) => {
    if (cat) {
      setEditingCat(cat);
      setFormData({
        name: cat.name,
        description: cat.description || '',
        sortOrder: (cat.sortOrder || 1).toString(),
      });
    } else {
      setEditingCat(null);
      setFormData({
        name: '',
        description: '',
        sortOrder: (categories.length + 1).toString(),
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCat) {
        await menuAPI.updateCategory(editingCat._id, {
          name: formData.name,
          description: formData.description,
          sortOrder: parseInt(formData.sortOrder) || 1,
        });
        toast.success(`Category "${formData.name}" updated`);
      } else {
        await menuAPI.createCategory({
          name: formData.name,
          description: formData.description,
          sortOrder: parseInt(formData.sortOrder) || 1,
        });
        toast.success(`Category "${formData.name}" created`);
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await menuAPI.deleteCategory(id);
      toast.success('Category deleted');
      setDeleteConfirmId(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cannot delete category with items');
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            Menu Categories
          </h1>
          <p className="text-xs sm:text-sm text-textPrimary/70 mt-1">
            Organize customer ordering navigation sections and sequence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCategories()}
            className="btn-outline flex items-center gap-1.5 text-xs py-2.5 px-3 bg-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-2 text-xs py-2.5 px-4"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      {/* Categories List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-20 bg-white/60 animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="card p-12 text-center max-w-md mx-auto my-12">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-primary text-base">No categories configured</h3>
          <p className="text-xs text-textPrimary/60 mt-1">
            Create categories like Starters, Main Course, and Beverages to organize dishes.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 max-w-3xl">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="card p-4 sm:p-5 flex items-center justify-between gap-4 hover:shadow-md transition-all border border-primary/5"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-black text-sm flex-shrink-0">
                  #{cat.sortOrder || 1}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-primary text-sm sm:text-base truncate">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-textPrimary/60 truncate mt-0.5 max-w-md">
                      {cat.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => openModal(cat)}
                  className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-all"
                  title="Edit Category"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(cat._id)}
                  className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-all"
                  title="Delete Category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <h3 className="font-bold text-primary text-lg">
                {editingCat ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Starters, Tandoori Specials"
                  className="input-field text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                  Sort Order Number
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: e.target.value }))}
                  placeholder="1"
                  min="1"
                  className="input-field text-sm"
                  required
                />
                <span className="text-[11px] text-textPrimary/50 mt-1 block">
                  Lower numbers appear first on the customer ordering menu.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief summary for this section..."
                  className="input-field text-xs sm:text-sm"
                  rows={2}
                />
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
                  {saving ? 'Saving...' : editingCat ? 'Save Changes' : 'Create Category'}
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
            <h3 className="font-bold text-primary text-base mb-1">Delete Category?</h3>
            <p className="text-xs text-textPrimary/70 mb-5">
              Categories with existing menu items cannot be deleted until those items are moved or deleted first.
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

export default function CategoriesPage() {
  return (
    <AdminLayoutWrapper>
      <CategoriesContent />
    </AdminLayoutWrapper>
  );
}
