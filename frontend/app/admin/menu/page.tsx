'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper';
import { menuAPI } from '@/services/api';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Leaf,
  Drumstick,
  Image as ImageIcon,
  X,
  Check,
  AlertTriangle,
  Clock,
  Star,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');

function MenuContent() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [foodTypeFilter, setFoodTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    foodType: 'veg',
    preparationTime: '15',
    isAvailable: true,
    isSpecial: false,
    imageURL: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        menuAPI.getItems(),
        menuAPI.getCategories(),
      ]);
      setItems(itemsRes.data.data || []);
      setCategories(catsRes.data.data || []);
    } catch {
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        category: item.category?._id || item.category || categories[0]?._id || '',
        foodType: item.foodType || 'veg',
        preparationTime: (item.preparationTime || 15).toString(),
        isAvailable: item.isAvailable !== false,
        isSpecial: item.isSpecial || false,
        imageURL: item.image?.startsWith('http') ? item.image : '',
      });
      const resolvedImg = item.image
        ? item.image.startsWith('http')
          ? item.image
          : `${API_ROOT}${item.image}`
        : '';
      setPreviewURL(resolvedImg);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: categories[0]?._id || '',
        foodType: 'veg',
        preparationTime: '15',
        isAvailable: true,
        isSpecial: false,
        imageURL: '',
      });
      setPreviewURL('');
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewURL(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, imageURL: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('description', formData.description);
      fd.append('price', formData.price);
      fd.append('category', formData.category);
      fd.append('foodType', formData.foodType);
      fd.append('preparationTime', formData.preparationTime);
      fd.append('isAvailable', String(formData.isAvailable));
      fd.append('isSpecial', String(formData.isSpecial));

      if (imageFile) {
        fd.append('image', imageFile);
      } else if (formData.imageURL) {
        fd.append('image', formData.imageURL);
      }

      if (editingItem) {
        await menuAPI.updateItem(editingItem._id, fd);
        toast.success(`Updated "${formData.name}"`);
      } else {
        await menuAPI.createItem(fd);
        toast.success(`Created "${formData.name}"`);
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving menu item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await menuAPI.deleteItem(id);
      toast.success('Menu item deleted');
      setDeleteConfirmId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const toggleAvailability = async (item: any) => {
    try {
      const fd = new FormData();
      fd.append('isAvailable', String(!item.isAvailable));
      await menuAPI.updateItem(item._id, fd);
      toast.success(`${item.name} marked ${!item.isAvailable ? 'available' : 'out of stock'}`);
      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, isAvailable: !i.isAvailable } : i))
      );
    } catch {
      toast.error('Failed to update availability');
    }
  };

  const filteredItems = items.filter((item) => {
    const matchSearch =
      !search ||
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCat || (item.category?._id || item.category) === selectedCat;
    const matchType = !foodTypeFilter || item.foodType === foodTypeFilter;
    return matchSearch && matchCat && matchType;
  });

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            Menu Management
          </h1>
          <p className="text-xs sm:text-sm text-textPrimary/70 mt-1">
            Create, edit, and organize restaurant menu items and prices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData()}
            className="btn-outline flex items-center gap-1.5 text-xs py-2.5 px-3 bg-white"
            title="Refresh Menu"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-2 text-xs py-2.5 px-4"
          >
            <Plus className="w-4 h-4" /> Add Food Item
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dish by name or ingredients..."
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
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="input-field text-xs sm:text-sm py-2.5 w-auto"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={foodTypeFilter}
          onChange={(e) => setFoodTypeFilter(e.target.value)}
          className="input-field text-xs sm:text-sm py-2.5 w-auto"
        >
          <option value="">All Diet Types</option>
          <option value="veg">🟢 Veg</option>
          <option value="non-veg">🔴 Non-Veg</option>
          <option value="vegan">🌿 Vegan</option>
        </select>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card h-64 bg-white/60 animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card p-12 text-center max-w-md mx-auto my-12">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-primary text-base">No food items found</h3>
          <p className="text-xs text-textPrimary/60 mt-1">
            Try adjusting your search or category filter, or click "Add Food Item" above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredItems.map((item) => {
            const imgSrc = item.image
              ? item.image.startsWith('http')
                ? item.image
                : `${API_ROOT}${item.image}`
              : null;

            return (
              <div
                key={item._id}
                className={`card overflow-hidden flex flex-col justify-between border-2 transition-all ${
                  !item.isAvailable ? 'opacity-65 border-gray-200' : 'border-primary/5 hover:border-secondary/40 shadow-xs hover:shadow-md'
                }`}
              >
                {/* Image and Tags */}
                <div>
                  <div className="relative h-44 bg-cream/80 overflow-hidden">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                        <ImageIcon className="w-10 h-10 mb-1" />
                        <span className="text-xs">No Photo</span>
                      </div>
                    )}

                    {/* Veg/Non-Veg Indicator Pill */}
                    <div className="absolute top-2.5 left-2.5">
                      <div
                        className={`w-6 h-6 rounded-md bg-white/90 backdrop-blur-xs border-2 flex items-center justify-center shadow-xs ${
                          item.foodType === 'veg' ? 'border-emerald-600' : 'border-rose-600'
                        }`}
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            item.foodType === 'veg' ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Special Badge */}
                    {item.isSpecial && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-accent text-primary text-[10px] font-black tracking-wide flex items-center gap-1 shadow-xs">
                        <Star className="w-3 h-3 fill-primary" /> Special
                      </div>
                    )}

                    {/* Prep time */}
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.preparationTime || 15}m
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-primary text-sm line-clamp-1">{item.name}</h3>
                      <span className="font-black text-secondary text-base flex-shrink-0">
                        ₹{item.price}
                      </span>
                    </div>

                    <p className="text-xs text-textPrimary/60 line-clamp-2 mb-3">
                      {item.description || 'Delicious freshly prepared authentic recipe.'}
                    </p>

                    <div className="text-[11px] font-semibold text-primary/70">
                      Category: {item.category?.name || 'Main Course'}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-3 border-t border-gray-100 bg-cream/30 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleAvailability(item)}
                    className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                      item.isAvailable
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {item.isAvailable ? '✓ In Stock' : '✗ Out of Stock'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModal(item)}
                      className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-all"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(item._id)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-primary text-lg">
                {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Image Preview & Upload */}
              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                  Dish Photography
                </label>
                <div className="flex gap-4 items-center">
                  <div className="w-24 h-24 rounded-2xl bg-cream border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {previewURL ? (
                      <img src={previewURL} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                    />
                    <div className="text-center text-[10px] text-gray-400 font-semibold uppercase">or paste image URL</div>
                    <input
                      type="url"
                      value={formData.imageURL}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, imageURL: e.target.value }));
                        setPreviewURL(e.target.value);
                        setImageFile(null);
                      }}
                      placeholder="https://images.unsplash.com/..."
                      className="input-field text-xs py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Dish Name */}
              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Tandoori Paneer Tikka"
                  className="input-field text-sm"
                  required
                />
              </div>

              {/* Price & Prep time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="250"
                    min="0"
                    className="input-field text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                    Prep Time (Mins)
                  </label>
                  <input
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, preparationTime: e.target.value }))}
                    placeholder="15"
                    min="1"
                    className="input-field text-sm"
                  />
                </div>
              </div>

              {/* Category & Diet Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="input-field text-sm"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                    Dietary Classification
                  </label>
                  <select
                    value={formData.foodType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, foodType: e.target.value }))}
                    className="input-field text-sm"
                  >
                    <option value="veg">🟢 Veg (Vegetarian)</option>
                    <option value="non-veg">🔴 Non-Veg</option>
                    <option value="vegan">🌿 Vegan</option>
                    <option value="egg">🥚 Egg</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                  Mouthwatering Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe ingredients, marinades, spices, and sides..."
                  className="input-field text-xs sm:text-sm"
                  rows={3}
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-primary">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isAvailable: e.target.checked }))}
                    className="w-4 h-4 accent-secondary rounded"
                  />
                  <span>Item Available for Ordering</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-primary">
                  <input
                    type="checkbox"
                    checked={formData.isSpecial}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isSpecial: e.target.checked }))}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <span>Chef's Special Recommendation</span>
                </label>
              </div>

              {/* Modal Buttons */}
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
                  {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
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
            <h3 className="font-bold text-primary text-base mb-1">Delete Menu Item?</h3>
            <p className="text-xs text-textPrimary/70 mb-5">
              This will permanently remove the item from the menu. Customer past orders will preserve their records.
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <AdminLayoutWrapper>
      <MenuContent />
    </AdminLayoutWrapper>
  );
}
