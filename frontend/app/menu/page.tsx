'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { tableAPI, menuAPI, orderAPI, paymentAPI } from '@/services/api';
import { CartProvider, useCart, CartItem } from '@/context/CartContext';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  X,
  Clock,
  CheckCircle,
  ChefHat,
  Star,
  Utensils,
  CreditCard,
  Banknote,
  Receipt,
  Package,
  AlertCircle,
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Bell,
} from 'lucide-react';

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');

type ActiveTab = 'menu' | 'cart' | 'orders' | 'bill';

const orderStatusMeta: Record<
  string,
  { label: string; badgeClass: string; icon: any; description: string }
> = {
  pending_approval: {
    label: 'Waiting for Waiter',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse',
    icon: Clock,
    description: 'Waiter is reviewing your order before dispatching to chef.',
  },
  confirmed: {
    label: 'Order Confirmed',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
    description: 'Accepted! Kitchen ticket printed.',
  },
  preparing: {
    label: 'Chef is Cooking',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: ChefHat,
    description: 'Fresh ingredients sizzling on stove / tandoor.',
  },
  ready: {
    label: 'Food Ready',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    icon: CheckCircle,
    description: 'Dish is plated and being brought to your table.',
  },
  served: {
    label: 'Served to Table',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Utensils,
    description: 'Enjoy your hot, delicious meal!',
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: CheckCircle,
    description: 'Order fulfilled and settled.',
  },
  rejected: {
    label: 'Order Rejected',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
    description: 'Item unavailable or kitchen unable to fulfill.',
  },
};

// Sub-component: Food Dish Card
function FoodItemCard({ item, onAdd }: { item: any; onAdd: (item: any) => void }) {
  const { items, updateQuantity } = useCart();
  const inCart = items.find((i) => i.menuItemId === item._id);

  const imgSrc = item.image
    ? item.image.startsWith('http')
      ? item.image
      : `${API_ROOT}${item.image}`
    : null;

  return (
    <div className="card overflow-hidden flex flex-col justify-between border border-primary/5 hover:border-secondary/30 shadow-xs hover:shadow-md transition-all group">
      <div>
        {/* Photo Container */}
        <div className="relative h-40 sm:h-48 bg-cream overflow-hidden">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-primary/30">
              <Utensils className="w-10 h-10 mb-1" />
              <span className="text-[11px] font-semibold">Fresh Preparation</span>
            </div>
          )}

          {/* Veg / Non-Veg Indicator */}
          <div className="absolute top-2.5 left-2.5">
            <div
              className={`w-6 h-6 rounded-md bg-white/95 backdrop-blur-xs border-2 flex items-center justify-center shadow-xs ${
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

          {/* Chef Special Badge */}
          {item.isSpecial && (
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-accent text-primary text-[10px] font-black flex items-center gap-1 shadow-xs">
              <Star className="w-3 h-3 fill-primary" /> Special
            </div>
          )}

          {/* Prep Time */}
          {item.preparationTime && (
            <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" /> {item.preparationTime}m
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-1 mb-1">
            <h4 className="font-extrabold text-primary text-sm sm:text-base leading-snug line-clamp-1">
              {item.name}
            </h4>
            <span className="font-black text-secondary text-sm sm:text-base flex-shrink-0">
              ₹{item.price}
            </span>
          </div>

          <p className="text-[11px] sm:text-xs text-textPrimary/65 line-clamp-2 mb-3 leading-relaxed">
            {item.description || 'Prepared fresh with authentic hand-ground spices and premium ingredients.'}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 sm:p-4 pt-0">
        {!inCart ? (
          <button
            onClick={() => onAdd(item)}
            className="w-full py-2.5 rounded-xl bg-secondary text-white font-bold text-xs sm:text-sm hover:bg-secondary/90 transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add to Order
          </button>
        ) : (
          <div className="flex items-center justify-between bg-primary/5 rounded-xl p-1 border border-primary/10">
            <button
              onClick={() => updateQuantity(inCart.menuItemId, inCart.quantity - 1)}
              className="w-8 h-8 rounded-lg bg-white text-primary flex items-center justify-center shadow-xs font-bold hover:bg-cream active:scale-95 transition-all"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-black text-primary text-sm font-mono w-8 text-center">
              {inCart.quantity}
            </span>
            <button
              onClick={() => updateQuantity(inCart.menuItemId, inCart.quantity + 1)}
              className="w-8 h-8 rounded-lg bg-secondary text-white flex items-center justify-center shadow-xs font-bold hover:bg-secondary/90 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component: Cart Row Item
function CartRowItem({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCart();
  const imgSrc = item.image
    ? item.image.startsWith('http')
      ? item.image
      : `${API_ROOT}${item.image}`
    : null;

  return (
    <div className="card p-3.5 sm:p-4 border border-primary/5 flex items-center gap-3">
      {imgSrc && (
        <img
          src={imgSrc}
          alt={item.name}
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <h5 className="font-bold text-primary text-xs sm:text-sm truncate">{item.name}</h5>
          <button
            onClick={() => removeItem(item.menuItemId)}
            className="text-gray-400 hover:text-danger p-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="font-extrabold text-secondary text-xs sm:text-sm mt-0.5">₹{item.price}</p>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 bg-cream rounded-lg p-1 border border-primary/5">
            <button
              onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
              className="w-6 h-6 rounded bg-white text-primary flex items-center justify-center font-bold text-xs shadow-xs"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-bold text-primary text-xs w-5 text-center font-mono">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
              className="w-6 h-6 rounded bg-secondary text-white flex items-center justify-center font-bold text-xs shadow-xs"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <span className="font-black text-primary text-xs sm:text-sm font-mono">
            ₹{(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

function MenuPortal() {
  const searchParams = useSearchParams();
  const qrToken = searchParams.get('table');

  const { items: cartItems, addItem, clearCart, total: cartSubtotal, itemCount } = useCart();

  const [activeTab, setActiveTab] = useState<ActiveTab>('menu');
  const [tableData, setTableData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [paymentRecord, setPaymentRecord] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [dietFilter, setDietFilter] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [payingOnline, setPayingOnline] = useState(false);

  // Load Table + Restaurant + Active Session Data
  const loadPortalData = useCallback(async () => {
    if (!qrToken) {
      setLoading(false);
      return;
    }
    try {
      const { data: res } = await tableAPI.getTableByToken(qrToken);
      const payload = res.data;
      setTableData(payload);

      const restaurantId = payload.restaurant._id;

      // Load menu & categories
      const [catsRes, itemsRes] = await Promise.all([
        menuAPI.getPublicCategories(restaurantId),
        menuAPI.getPublicItems(restaurantId),
      ]);
      setCategories(catsRes.data.data || []);
      setMenuItems(itemsRes.data.data || []);

      // If active table session exists, fetch past orders & running bill
      if (payload.session?.sessionToken) {
        const [ordersRes, billRes] = await Promise.all([
          orderAPI.getSessionOrders(payload.session.sessionToken),
          paymentAPI.getSessionBill(payload.session.sessionToken),
        ]);
        setOrders(ordersRes.data.data || []);
        setPaymentRecord(billRes.data.data?.payment || null);
      }
    } catch (err: any) {
      toast.error('Could not load table menu. QR Code may be invalid.');
    } finally {
      setLoading(false);
    }
  }, [qrToken]);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  // Real-Time Socket Connection for Instant Customer Updates
  useEffect(() => {
    if (!tableData?.session?._id) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000');

    // Join session and table rooms
    socket.emit('join-session', tableData.session._id);
    if (tableData.table?._id) {
      socket.emit('join-table', tableData.table._id);
    }

    const handleOrderUpdate = (data: any) => {
      const statusKey = data?.status || data?.order?.status;
      const statusLabel = orderStatusMeta[statusKey]?.label || statusKey;
      toast.success(
        `Food Update: Order #${data?.order?.orderNumber || ''} is now "${statusLabel}"!`,
        { icon: '👨‍🍳', duration: 5000 }
      );
      // Immediately refresh orders list
      if (tableData.session?.sessionToken) {
        orderAPI.getSessionOrders(tableData.session.sessionToken).then((res) => {
          setOrders(res.data.data || []);
        });
      }
    };

    socket.on('order-status-updated', handleOrderUpdate);
    socket.on('order-updated', handleOrderUpdate);

    socket.on('payment-success', () => {
      toast.success('Your bill payment has been successfully recorded! Thank you!', {
        icon: '🎉',
        duration: 6000,
      });
      paymentAPI.getSessionBill(tableData.session.sessionToken).then((res) => {
        setPaymentRecord(res.data.data?.payment || null);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [tableData]);

  // Reliable Auto-Polling Fallback: auto-refreshes every 4s while food is being prepared
  useEffect(() => {
    if (!tableData?.session?.sessionToken) return;
    const hasActiveOrders = orders.some((o) =>
      ['pending_approval', 'confirmed', 'preparing', 'ready'].includes(o.status)
    );
    if (!hasActiveOrders) return;

    const interval = setInterval(() => {
      orderAPI.getSessionOrders(tableData.session.sessionToken).then((res) => {
        setOrders(res.data.data || []);
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [tableData, orders]);

  // Add Item to cart handler
  const handleAddItem = (dish: any) => {
    addItem({
      menuItemId: dish._id,
      name: dish.name,
      price: dish.price,
      image: dish.image,
      foodType: dish.foodType || 'veg',
    });
    toast.success(`Added ${dish.name}`, { duration: 1500 });
  };

  // Place Order Handler (Creates a new order without overwriting previous orders!)
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    if (!tableData?.session?.sessionToken) {
      toast.error('Active session not found. Please rescan QR code.');
      return;
    }

    setPlacingOrder(true);
    try {
      const orderPayload = {
        sessionToken: tableData.session.sessionToken,
        items: cartItems.map((c) => ({
          menuItemId: c.menuItemId,
          name: c.name,
          quantity: c.quantity,
          specialInstructions: c.specialInstructions || '',
        })),
        specialInstructions,
      };

      const { data } = await orderAPI.placeOrder(orderPayload);
      clearCart();
      setSpecialInstructions('');
      toast.success('Order placed! Sent to waiter for confirmation.', {
        icon: '🛎️',
        duration: 4000,
      });

      // Reload orders & move user to "Orders" tab so they see live status
      const ordersRes = await orderAPI.getSessionOrders(tableData.session.sessionToken);
      setOrders(ordersRes.data.data || []);
      setActiveTab('orders');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error placing order');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Online Razorpay Payment Checkout
  const handlePayOnline = async () => {
    if (!tableData?.session?.sessionToken) return;
    setPayingOnline(true);
    try {
      const { data: res } = await paymentAPI.createRazorpayOrder({
        sessionToken: tableData.session.sessionToken,
      });

      const { razorpayOrderId, amount, currency, keyId, payment: paymentId, restaurantName, billNumber } =
        res.data;

      // Dynamically load Razorpay standard script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: keyId,
          amount,
          currency,
          name: restaurantName || tableData.restaurant.name,
          description: `Bill ${billNumber} for ${tableData.table.displayName}`,
          order_id: razorpayOrderId,
          handler: async (response: any) => {
            try {
              await paymentAPI.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId,
              });
              toast.success('Payment verified & recorded! Thank you for dining!');
              loadPortalData();
            } catch {
              toast.error('Payment verification failed on server');
            }
          },
          prefill: {
            name: `${tableData.table.displayName} Guest`,
          },
          theme: {
            color: '#C65D3A',
          },
          modal: {
            ondismiss: () => setPayingOnline(false),
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Online payment initialization failed. You can pay cash at counter.');
      setPayingOnline(false);
    }
  };

  // Filtered menu items
  const filteredDishes = menuItems.filter((dish) => {
    const matchSearch =
      !search ||
      dish.name?.toLowerCase().includes(search.toLowerCase()) ||
      dish.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCat || (dish.category?._id || dish.category) === selectedCat;
    const matchDiet = !dietFilter || dish.foodType === dietFilter;
    return matchSearch && matchCat && matchDiet;
  });

  // Calculate Running Bill for Confirmed/Preparing/Ready/Served/Completed orders
  const validOrders = orders.filter((o) => o.status !== 'rejected');
  const runningSubtotal = validOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const gstRate = tableData?.restaurant?.gstPercentage ?? 5;
  const serviceRate = tableData?.restaurant?.serviceCharge ?? 2;
  const runningGST = (runningSubtotal * gstRate) / 100;
  const runningServiceCharge = (runningSubtotal * serviceRate) / 100;
  const runningGrandTotal = runningSubtotal + runningGST + runningServiceCharge;

  // Latest active order for live food preparation status
  const latestActiveOrder = orders.find((o) =>
    ['pending_approval', 'confirmed', 'preparing', 'ready'].includes(o.status)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-primary text-accent flex items-center justify-center shadow-xl animate-bounce mb-4">
          <Utensils className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-primary">Connecting to Table...</h2>
        <p className="text-xs text-textPrimary/60 mt-1">Fetching freshly updated menu & running bill</p>
      </div>
    );
  }

  if (!tableData) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-primary">Table Not Found</h2>
        <p className="text-xs text-textPrimary/70 max-w-sm mt-1 mb-6">
          Please scan the official QR code placed on your restaurant table to view the menu and order.
        </p>
        <a href="/" className="btn-primary text-xs py-2.5 px-6">
          Return to Home
        </a>
      </div>
    );
  }

  const { restaurant, table } = tableData;

  return (
    <div className="min-h-screen bg-cream pb-24 text-textPrimary antialiased max-w-2xl mx-auto shadow-xl bg-white/50">
      {/* Top Banner Header */}
      <header className="bg-gradient-to-r from-primary to-secondary text-cream p-4 sm:p-5 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {restaurant.logo ? (
              <img
                src={restaurant.logo.startsWith('http') ? restaurant.logo : `${API_ROOT}${restaurant.logo}`}
                alt="Logo"
                className="w-11 h-11 rounded-xl object-cover bg-white p-0.5 shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-accent text-primary flex items-center justify-center font-bold shadow-sm flex-shrink-0">
                <Utensils className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-extrabold text-white text-base sm:text-lg leading-tight truncate">
                {restaurant.name}
              </h1>
              <p className="text-xs text-cream/70 truncate flex items-center gap-1 mt-0.5">
                <span>{table.displayName}</span>
                <span>•</span>
                <span className="text-emerald-300 font-semibold">Active Dining Session</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs px-2.5 py-1 rounded-xl bg-accent text-primary font-black shadow-xs">
              {table.displayName}
            </span>
          </div>
        </div>
      </header>

      {/* Navigation Sticky Tabs */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-primary/10 sticky top-[68px] sm:top-[76px] z-30 shadow-xs">
        <div className="grid grid-cols-4 text-center">
          {[
            { id: 'menu', label: 'Menu', icon: Utensils },
            { id: 'cart', label: `Cart${itemCount > 0 ? ` (${itemCount})` : ''}`, icon: ShoppingCart },
            {
              id: 'orders',
              label: `Orders${orders.length > 0 ? ` (${orders.length})` : ''}`,
              icon: Package,
              pulse: orders.some((o) => ['pending_approval', 'confirmed', 'preparing', 'ready'].includes(o.status)),
            },
            { id: 'bill', label: 'Bill', icon: Receipt },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`py-3 text-xs font-bold transition-all border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1 relative ${
                  active
                    ? 'border-secondary text-secondary font-extrabold'
                    : 'border-transparent text-textPrimary/60 hover:text-textPrimary'
                }`}
              >
                <div className="relative">
                  <tab.icon className={`w-4 h-4 ${tab.pulse && !active ? 'text-secondary animate-bounce' : ''}`} />
                  {tab.pulse && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-secondary ring-2 ring-white animate-ping" />
                  )}
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Live Kitchen & Food Preparation Status Banner (Visible across all tabs) */}
      {latestActiveOrder && (
        <div
          onClick={() => setActiveTab('orders')}
          className={`cursor-pointer px-4 py-2.5 shadow-md flex items-center justify-between transition-all hover:brightness-105 border-b border-white/20 select-none ${
            latestActiveOrder.status === 'preparing'
              ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white'
              : latestActiveOrder.status === 'ready'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white animate-pulse'
              : latestActiveOrder.status === 'confirmed'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
              : 'bg-gradient-to-r from-amber-500 to-yellow-600 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              {latestActiveOrder.status === 'preparing' && <ChefHat className="w-4 h-4 animate-bounce" />}
              {latestActiveOrder.status === 'ready' && <Bell className="w-4 h-4 animate-bounce" />}
              {latestActiveOrder.status === 'confirmed' && <CheckCircle className="w-4 h-4" />}
              {latestActiveOrder.status === 'pending_approval' && <Clock className="w-4 h-4 animate-spin" />}
            </div>
            <div className="min-w-0">
              <p className="font-black text-xs sm:text-sm tracking-wide flex items-center gap-1.5 flex-wrap">
                <span>
                  {latestActiveOrder.status === 'preparing' && 'In Kitchen: Chef is Cooking Your Food!'}
                  {latestActiveOrder.status === 'ready' && 'Food Ready! Dishes are being served!'}
                  {latestActiveOrder.status === 'confirmed' && 'Order Confirmed: Sent to Kitchen'}
                  {latestActiveOrder.status === 'pending_approval' && 'Order Placed: Waiting for Waiter'}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-white/25 rounded font-mono">
                  #{latestActiveOrder.orderNumber}
                </span>
              </p>
              <p className="text-[11px] opacity-90 truncate">
                {latestActiveOrder.status === 'preparing' && `Dishes are sizzling fresh. ${table.displayName} will be served hot shortly!`}
                {latestActiveOrder.status === 'ready' && 'Plated and ready! Watch for the waiter at your table.'}
                {latestActiveOrder.status === 'confirmed' && 'Kitchen ticket received. Preparation starting momentarily.'}
                {latestActiveOrder.status === 'pending_approval' && 'Waiter is reviewing your order items before cooking.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold bg-white text-primary px-2.5 py-1 rounded-lg flex-shrink-0 shadow-xs ml-2">
            <span>Track</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* TAB 1: MENU PORTAL */}
      {activeTab === 'menu' && (
        <div className="p-4 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes, curries, drinks..."
              className="input-field pl-10 text-xs sm:text-sm py-2.5 bg-white shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Diet filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { id: '', label: 'All Dishes' },
              { id: 'veg', label: '🟢 Veg Only' },
              { id: 'non-veg', label: '🔴 Non-Veg' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDietFilter(d.id)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  dietFilter === d.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white text-textPrimary/70 border border-primary/10 hover:bg-primary/5'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Categories Horizontal Carousel */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedCat('')}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                !selectedCat
                  ? 'bg-secondary text-white shadow-xs'
                  : 'bg-white text-textPrimary/70 border border-primary/10 hover:bg-primary/5'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedCat(c._id)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCat === c._id
                    ? 'bg-secondary text-white shadow-xs'
                    : 'bg-white text-textPrimary/70 border border-primary/10 hover:bg-primary/5'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Chef's Specials Highlight (Shown when no search/cat filter) */}
          {!selectedCat && !search && !dietFilter && (
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <h3 className="font-extrabold text-primary text-sm tracking-tight">Chef's Signature Specials</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {menuItems
                  .filter((m) => m.isSpecial && m.isAvailable)
                  .slice(0, 4)
                  .map((dish) => (
                    <FoodItemCard key={dish._id} item={dish} onAdd={handleAddItem} />
                  ))}
              </div>
            </div>
          )}

          {/* Main Menu Grid / Grouped by Category */}
          {filteredDishes.length === 0 ? (
            <div className="card p-12 text-center my-6">
              <Utensils className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="font-bold text-sm text-primary">No dishes found</p>
              <p className="text-xs text-textPrimary/60">Try clearing filters or search term</p>
            </div>
          ) : !selectedCat && !search && !dietFilter ? (
            // Group by each category
            categories.map((cat) => {
              const catDishes = filteredDishes.filter(
                (d) => (d.category?._id || d.category) === cat._id
              );
              if (catDishes.length === 0) return null;
              return (
                <div key={cat._id} className="pt-2">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-primary/10">
                    <h3 className="font-extrabold text-primary text-base tracking-tight">
                      {cat.name}
                    </h3>
                    <span className="text-[11px] font-semibold text-textPrimary/50">
                      {catDishes.length} dish{catDishes.length > 1 ? 'es' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {catDishes.map((dish) => (
                      <FoodItemCard key={dish._id} item={dish} onAdd={handleAddItem} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredDishes.map((dish) => (
                <FoodItemCard key={dish._id} item={dish} onAdd={handleAddItem} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CART VIEW */}
      {activeTab === 'cart' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-lg font-extrabold text-primary">Current Order Items</h2>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-600 font-semibold hover:underline"
              >
                Clear Cart
              </button>
            )}
          </div>

          {cartItems.length === 0 ? (
            <div className="card p-12 text-center my-6">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-primary text-base">Your Cart is Empty</h3>
              <p className="text-xs text-textPrimary/60 mt-1 mb-6">
                Browse our delicious menu and add starters, curries, or beverages.
              </p>
              <button
                onClick={() => setActiveTab('menu')}
                className="btn-primary text-xs py-2.5 px-6 mx-auto"
              >
                Explore Menu
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items List */}
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <CartRowItem key={item.menuItemId} item={item} />
                ))}
              </div>

              {/* Special Instructions Box */}
              <div className="card p-4 border border-primary/5">
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                  Special Cooking Instructions (Optional)
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Less spicy, Jain preparation, allergies to peanuts, extra lime..."
                  className="input-field text-xs sm:text-sm"
                  rows={2}
                />
              </div>

              {/* Price Calculation Card */}
              <div className="card p-4 space-y-2 border border-primary/5 bg-cream/40">
                <div className="flex justify-between text-xs text-textPrimary/70">
                  <span>Items Subtotal ({itemCount}):</span>
                  <span className="font-mono">₹{cartSubtotal.toFixed(2)}</span>
                </div>
                {gstRate > 0 && (
                  <div className="flex justify-between text-xs text-textPrimary/70">
                    <span>GST ({gstRate}%):</span>
                    <span className="font-mono">₹{((cartSubtotal * gstRate) / 100).toFixed(2)}</span>
                  </div>
                )}
                {serviceRate > 0 && (
                  <div className="flex justify-between text-xs text-textPrimary/70">
                    <span>Service Charge ({serviceRate}%):</span>
                    <span className="font-mono">
                      ₹{((cartSubtotal * serviceRate) / 100).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-primary/10 flex justify-between font-extrabold text-base text-primary">
                  <span>This Order Total:</span>
                  <span className="text-secondary font-mono">
                    ₹
                    {(
                      cartSubtotal +
                      (cartSubtotal * gstRate) / 100 +
                      (cartSubtotal * serviceRate) / 100
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Place Order CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="w-full py-4 rounded-2xl bg-secondary text-white font-extrabold text-base hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
              >
                {placingOrder ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Sending to Waiter...</span>
                  </>
                ) : (
                  <>
                    <Utensils className="w-5 h-5" />
                    <span>Place Order for {table.displayName}</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-textPrimary/60">
                * An authorized waiter will verify and dispatch your order to the kitchen.
              </p>
            </>
          )}
        </div>
      )}

      {/* TAB 3: MY ORDERS & REORDER TRACKING */}
      {activeTab === 'orders' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-primary">Table Orders History</h2>
              <p className="text-xs text-textPrimary/60">Live kitchen preparation status for {table.displayName}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (tableData?.session?.sessionToken) {
                    const res = await orderAPI.getSessionOrders(tableData.session.sessionToken);
                    setOrders(res.data.data || []);
                    toast.success('Orders refreshed');
                  }
                }}
                className="btn-outline text-xs py-1.5 px-2.5 flex items-center gap-1 font-semibold"
                title="Refresh order status"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
              <button
                onClick={() => setActiveTab('menu')}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 font-bold"
              >
                <Plus className="w-3.5 h-3.5" /> Reorder / Add More
              </button>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="card p-12 text-center my-6">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-primary text-base">No Orders Placed Yet</h3>
              <p className="text-xs text-textPrimary/60 mt-1 mb-6">
                When you place orders, their live kitchen preparation status appears right here.
              </p>
              <button
                onClick={() => setActiveTab('menu')}
                className="btn-primary text-xs py-2.5 px-6 mx-auto"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, idx) => {
                const meta = orderStatusMeta[order.status] || orderStatusMeta.pending_approval;
                const Icon = meta.icon;

                return (
                  <div
                    key={order._id}
                    className="card p-4 sm:p-5 border-2 border-primary/5 hover:border-primary/20 shadow-xs transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-primary text-sm sm:text-base">
                            Order #{order.orderNumber}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                            Round {orders.length - idx}
                          </span>
                        </div>
                        <span className="text-[11px] text-textPrimary/50 font-medium">
                          {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${meta.badgeClass}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{meta.label}</span>
                      </div>
                    </div>

                    {/* 5-Step Visual Kitchen Preparation Stepper */}
                    {order.status !== 'rejected' && (
                      <div className="my-3 px-2 py-3 bg-cream/70 rounded-xl border border-primary/5">
                        <div className="flex items-center justify-between relative px-2">
                          {/* Background Track Line */}
                          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-gray-200 -z-0" />
                          {/* Active Progress Fill Line */}
                          <div
                            className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-secondary transition-all duration-500 -z-0"
                            style={{
                              width: `${
                                order.status === 'pending_approval'
                                  ? '0%'
                                  : order.status === 'confirmed'
                                  ? '25%'
                                  : order.status === 'preparing'
                                  ? '50%'
                                  : order.status === 'ready'
                                  ? '75%'
                                  : '100%'
                              }`,
                            }}
                          />

                          {[
                            { key: 'pending_approval', label: 'Placed', icon: Clock },
                            { key: 'confirmed', label: 'Approved', icon: CheckCircle },
                            { key: 'preparing', label: 'Cooking', icon: ChefHat },
                            { key: 'ready', label: 'Ready', icon: Bell },
                            { key: 'served', label: 'Served', icon: Utensils },
                          ].map((step) => {
                            const steps = ['pending_approval', 'confirmed', 'preparing', 'ready', 'served', 'completed'];
                            const stepIdx = steps.indexOf(step.key);
                            const currentIdx = steps.indexOf(order.status);
                            const isDone = currentIdx > stepIdx || order.status === 'completed';
                            const isCurrent = order.status === step.key;

                            return (
                              <div key={step.key} className="flex flex-col items-center z-10">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                    isCurrent
                                      ? 'bg-secondary text-white ring-4 ring-secondary/20 scale-110 animate-pulse'
                                      : isDone
                                      ? 'bg-secondary text-white'
                                      : 'bg-white text-gray-400 border border-gray-300'
                                  }`}
                                  title={step.label}
                                >
                                  <step.icon className="w-3.5 h-3.5" />
                                </div>
                                <span
                                  className={`text-[10px] mt-1 font-bold ${
                                    isCurrent ? 'text-secondary font-black' : isDone ? 'text-primary' : 'text-gray-400'
                                  }`}
                                >
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Progress Helper Note */}
                    <p className="text-xs text-textPrimary/70 mb-3 bg-cream/70 p-2.5 rounded-xl border border-primary/5">
                      {meta.description}
                    </p>

                    {/* Items */}
                    <div className="space-y-1.5 text-xs sm:text-sm border-t border-gray-100 pt-2 mb-3">
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-textPrimary">
                          <span>
                            {item.quantity} × {item.name}
                          </span>
                          <span className="font-mono font-semibold">₹{item.subtotal}</span>
                        </div>
                      ))}
                    </div>

                    {/* Instructions */}
                    {order.specialInstructions && (
                      <p className="text-xs text-secondary italic mb-3">
                        Note: "{order.specialInstructions}"
                      </p>
                    )}

                    {/* Bill Breakdown with Extra Charges */}
                    <div className="pt-2.5 border-t border-gray-100 space-y-1.5 text-xs bg-cream/40 p-3 rounded-xl">
                      <div className="flex justify-between text-textPrimary/70">
                        <span>Items Subtotal:</span>
                        <span className="font-mono font-medium">
                          ₹{Number(order.subtotal ?? (order.totalAmount - (order.gstAmount || 0) - (order.serviceCharge || 0))).toFixed(2)}
                        </span>
                      </div>

                      {(order.gstAmount > 0 || gstRate > 0) && (
                        <div className="flex justify-between text-textPrimary/70">
                          <span>GST ({gstRate}%):</span>
                          <span className="font-mono text-emerald-800">
                            +₹{Number(order.gstAmount ?? (((order.subtotal || 0) * gstRate) / 100)).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {(order.serviceCharge > 0 || serviceRate > 0) && (
                        <div className="flex justify-between text-textPrimary/70">
                          <span>Service Charge ({serviceRate}%):</span>
                          <span className="font-mono text-emerald-800">
                            +₹{Number(order.serviceCharge ?? (((order.subtotal || 0) * serviceRate) / 100)).toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-primary/10 flex justify-between items-center font-bold text-sm">
                        <span className="text-primary font-bold">Round Total:</span>
                        <span className="text-secondary font-black text-base font-mono">
                          ₹{Number(order.totalAmount || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {order.status === 'rejected' && order.rejectionReason && (
                      <div className="mt-2.5 p-2 rounded-lg bg-red-50 text-red-700 text-xs">
                        <b>Reason:</b> {order.rejectionReason}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Running Table Bill with Extra Charges Breakdown */}
              <div className="card p-4 sm:p-5 bg-white border border-secondary/20 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-secondary" />
                    <h3 className="font-bold text-sm text-primary">Cumulative Table Bill</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-textPrimary/60">
                    {orders.length} round{orders.length > 1 ? 's' : ''} placed
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-textPrimary/80">
                  <div className="flex justify-between">
                    <span>Items Subtotal:</span>
                    <span className="font-mono font-semibold">₹{runningSubtotal.toFixed(2)}</span>
                  </div>
                  {gstRate > 0 && (
                    <div className="flex justify-between">
                      <span>GST ({gstRate}%):</span>
                      <span className="font-mono text-emerald-800">+₹{runningGST.toFixed(2)}</span>
                    </div>
                  )}
                  {serviceRate > 0 && (
                    <div className="flex justify-between">
                      <span>Service Charge ({serviceRate}%):</span>
                      <span className="font-mono text-emerald-800">+₹{runningServiceCharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center font-black text-base text-primary">
                    <span>Total Table Bill:</span>
                    <span className="text-secondary font-mono text-lg">₹{runningGrandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('bill')}
                  className="w-full py-2.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>View Detailed Tax Bill & Settlement →</span>
                </button>
              </div>

              {/* Re-order prompt */}
              <div className="card p-4 bg-gradient-to-r from-secondary/10 to-accent/10 border border-secondary/20 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-primary text-xs sm:text-sm">Still hungry or want drinks?</h4>
                  <p className="text-[11px] text-textPrimary/70">Order extra items anytime during your meal.</p>
                </div>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="btn-primary text-xs py-2 px-3.5 flex-shrink-0"
                >
                  + Add Food
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RUNNING BILL & PAYMENT */}
      {activeTab === 'bill' && (
        <div className="p-4 space-y-4">
          <div className="text-center pb-2">
            <h2 className="text-xl font-extrabold text-primary">Running Table Bill</h2>
            <p className="text-xs text-textPrimary/60">
              Consolidated invoice for all approved orders at {table.displayName}
            </p>
          </div>

          {validOrders.length === 0 ? (
            <div className="card p-12 text-center my-6">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-primary text-base">No Bill Generated Yet</h3>
              <p className="text-xs text-textPrimary/60 mt-1 mb-6">
                Your running bill will appear here once you place orders and they are confirmed.
              </p>
              <button
                onClick={() => setActiveTab('menu')}
                className="btn-primary text-xs py-2.5 px-6 mx-auto"
              >
                Start Ordering
              </button>
            </div>
          ) : (
            <>
              {/* Itemized Bill Paper Card */}
              <div className="card p-5 border-2 border-primary/10 shadow-sm relative overflow-hidden bg-white">
                <div className="text-center pb-4 mb-4 border-b border-dashed border-gray-300">
                  <h3 className="font-black text-primary text-base sm:text-lg">
                    {restaurant.name}
                  </h3>
                  <p className="text-xs text-textPrimary/70 font-medium">
                    {table.displayName} • {new Date().toLocaleDateString('en-IN')}
                  </p>
                  {restaurant.gstNumber && (
                    <p className="text-[10px] text-textPrimary/50 font-mono mt-0.5">
                      GSTIN: {restaurant.gstNumber}
                    </p>
                  )}
                </div>

                {/* Orders Breakdown */}
                <div className="space-y-3 mb-4">
                  {validOrders.map((ord, idx) => (
                    <div key={ord._id} className="pb-2 border-b border-gray-100 last:border-0">
                      <div className="flex justify-between items-center mb-1 text-xs font-bold text-primary">
                        <span>Order #{ord.orderNumber}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream text-secondary capitalize">
                          {ord.status.replace('_', ' ')}
                        </span>
                      </div>
                      {ord.items?.map((it: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs text-textPrimary/80 py-0.5">
                          <span>
                            {it.quantity} × {it.name}
                          </span>
                          <span className="font-mono">₹{it.subtotal}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Bill Math Calculation */}
                <div className="pt-3 border-t-2 border-dashed border-gray-300 space-y-1.5 text-xs text-textPrimary/80">
                  <div className="flex justify-between">
                    <span>Items Total:</span>
                    <span className="font-mono font-semibold">₹{runningSubtotal.toFixed(2)}</span>
                  </div>
                  {gstRate > 0 && (
                    <div className="flex justify-between">
                      <span>GST ({gstRate}%):</span>
                      <span className="font-mono">₹{runningGST.toFixed(2)}</span>
                    </div>
                  )}
                  {serviceRate > 0 && (
                    <div className="flex justify-between">
                      <span>Service Charge ({serviceRate}%):</span>
                      <span className="font-mono">₹{runningServiceCharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-200 flex justify-between font-black text-lg text-primary">
                    <span>Grand Total:</span>
                    <span className="text-secondary font-mono">₹{runningGrandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              {paymentRecord?.paymentStatus === 'paid' ? (
                <div className="card p-6 text-center bg-emerald-50 border-2 border-emerald-300 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white mx-auto mb-3 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-emerald-900">Payment Completed!</h3>
                  <p className="text-xs text-emerald-800/80 mt-1">
                    Bill #{paymentRecord.billNumber} has been settled in full.
                  </p>
                  <p className="text-xs text-emerald-800/60 mt-2 font-medium">
                    Thank you for dining with us! We look forward to welcoming you again.
                  </p>
                </div>
              ) : (
                <div className="card p-5 space-y-3 border border-primary/10">
                  <h4 className="font-bold text-primary text-sm">Select Settlement Method</h4>

                  {/* Online payment option */}
                  {restaurant.settings?.allowOnlinePayment && (
                    <button
                      onClick={handlePayOnline}
                      disabled={payingOnline}
                      className="w-full py-3.5 rounded-xl bg-secondary text-white font-bold text-sm hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
                    >
                      <CreditCard className="w-4 h-4" />
                      {payingOnline ? 'Opening Gateway...' : `Pay Online (UPI / GPay / Card) • ₹${runningGrandTotal.toFixed(0)}`}
                    </button>
                  )}

                  {/* Cash payment option */}
                  {restaurant.settings?.allowCashPayment && (
                    <div className="p-3.5 rounded-xl bg-cream border border-primary/10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Banknote className="w-5 h-5 text-emerald-700" />
                        <div>
                          <p className="text-xs font-bold text-primary">Pay at Counter / Cash</p>
                          <p className="text-[11px] text-textPrimary/60">
                            Inform your waiter or pay at the cash desk
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-md bg-white text-primary font-bold border border-primary/10">
                        Available
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Floating Bottom Bar: When on Menu view and cart has items */}
      {activeTab === 'menu' && itemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40">
          <button
            onClick={() => setActiveTab('cart')}
            className="w-full py-3.5 px-5 rounded-2xl bg-secondary text-white font-extrabold flex items-center justify-between shadow-2xl hover:bg-secondary/95 transition-all active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-xs font-black">
                {itemCount}
              </div>
              <span className="text-sm">
                View Cart ({itemCount} item{itemCount > 1 ? 's' : ''})
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-mono">
              <span>₹{cartSubtotal.toFixed(2)}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default function CustomerPortalPage() {
  return (
    <CartProvider>
      <Suspense
        fallback={
          <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary text-accent flex items-center justify-center animate-bounce mb-3">
              <Utensils className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-primary">Loading Menu...</p>
          </div>
        }
      >
        <MenuPortal />
      </Suspense>
    </CartProvider>
  );
}
