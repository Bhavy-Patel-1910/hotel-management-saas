import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/admin') && !path.includes('/login')) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth Services
export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.put('/auth/change-password', data),
};

// Menu & Categories Services
export const menuAPI = {
  // Public
  getPublicCategories: (restaurantId: string) => api.get(`/menu/public/${restaurantId}/categories`),
  getPublicItems: (restaurantId: string, params?: any) => api.get(`/menu/public/${restaurantId}/items`, { params }),
  // Admin
  getCategories: () => api.get('/menu/categories'),
  createCategory: (data: any) => api.post('/menu/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/menu/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/menu/categories/${id}`),
  getItems: (params?: any) => api.get('/menu/items', { params }),
  createItem: (data: FormData) => api.post('/menu/items', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateItem: (id: string, data: FormData) => api.put(`/menu/items/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteItem: (id: string) => api.delete(`/menu/items/${id}`),
};

// Table Services
export const tableAPI = {
  // Public
  getTableByToken: (token: string) => api.get(`/tables/scan/${token}`),
  // Admin
  getTables: () => api.get('/tables'),
  createTable: (data: any) => api.post('/tables', data),
  updateTable: (id: string, data: any) => api.put(`/tables/${id}`, data),
  deleteTable: (id: string) => api.delete(`/tables/${id}`),
  regenerateQR: (id: string) => api.post(`/tables/${id}/regenerate-qr`),
};

// Order Services
export const orderAPI = {
  // Public Customer
  placeOrder: (data: { sessionToken: string; items: any[]; specialInstructions?: string }) => api.post('/orders/place', data),
  getSessionOrders: (sessionToken: string) => api.get(`/orders/session/${sessionToken}`),
  // Admin
  getOrders: (params?: any) => api.get('/orders', { params }),
  getOrderStats: () => api.get('/orders/stats'),
  updateOrderStatus: (id: string, data: { status: string; rejectionReason?: string }) => api.put(`/orders/${id}/status`, data),
};

// Payment & Billing Services
export const paymentAPI = {
  // Public Customer
  createRazorpayOrder: (data: { sessionToken: string }) => api.post('/payments/create-order', data),
  verifyPayment: (data: any) => api.post('/payments/verify', data),
  getSessionBill: (sessionToken: string) => api.get(`/payments/bill/${sessionToken}`),
  // Admin
  getPayments: (params?: any) => api.get('/payments', { params }),
  markCashPayment: (tableSessionId: string) => api.post(`/payments/cash/${tableSessionId}`),
  getRevenueStats: () => api.get('/payments/revenue'),
};

// Restaurant & Staff Services
export const restaurantAPI = {
  getRestaurant: () => api.get('/restaurant'),
  updateRestaurant: (data: FormData) => api.put('/restaurant', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getStaff: () => api.get('/restaurant/staff'),
  createStaff: (data: any) => api.post('/restaurant/staff', data),
  updateStaff: (id: string, data: any) => api.put(`/restaurant/staff/${id}`, data),
  deleteStaff: (id: string) => api.delete(`/restaurant/staff/${id}`),
  resetStaffPassword: (id: string, data: { newPassword: string }) => api.post(`/restaurant/staff/${id}/reset-password`, data),
};
