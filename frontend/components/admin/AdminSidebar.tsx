'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Tag,
  QrCode,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Live Orders', icon: ShoppingBag, href: '/admin/orders', badge: 'Live' },
  { label: 'Menu Items', icon: UtensilsCrossed, href: '/admin/menu' },
  { label: 'Categories', icon: Tag, href: '/admin/categories' },
  { label: 'Tables & QR', icon: QrCode, href: '/admin/tables' },
  { label: 'Billing & Bills', icon: CreditCard, href: '/admin/billing' },
  { label: 'Revenue Analytics', icon: BarChart3, href: '/admin/analytics' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, restaurant, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-primary text-cream select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 shadow-md">
            <UtensilsCrossed className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-white text-sm truncate leading-tight">
              {restaurant?.name || 'Spice Garden Hotel'}
            </h2>
            <p className="text-white/60 text-xs font-medium capitalize mt-0.5">
              {user?.role ? `${user.role} Dashboard` : 'Admin Portal'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <button
              key={item.href}
              onClick={() => {
                router.push(item.href);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-secondary text-white font-semibold shadow-md'
                  : 'text-cream/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-accent' : 'text-cream/70'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && !active && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-bold animate-pulse">
                  {item.badge}
                </span>
              )}
              {active && <ChevronRight className="w-4 h-4 text-white/80" />}
            </button>
          );
        })}
      </nav>

      {/* User profile & Logout */}
      <div className="p-3 border-t border-white/10 bg-black/10">
        <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-xl bg-white/5">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
            {user?.name ? user.name[0]?.toUpperCase() : 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[11px] text-white/60 truncate">{user?.email || 'admin@hotel.com'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top trigger bar */}
      <div className="lg:hidden bg-primary text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-primary font-bold">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm truncate max-w-[200px]">
            {restaurant?.name || 'Hotel Admin'}
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 active:scale-95"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 h-full shadow-2xl z-10 flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 z-20 p-2 text-white/70 hover:text-white"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Fixed Pinned Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 z-30 border-r border-primary/10 shadow-lg">
        <SidebarContent />
      </aside>
    </>
  );
}
