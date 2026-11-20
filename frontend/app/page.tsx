'use client';

import Link from 'next/link';
import { UtensilsCrossed, QrCode, ShieldCheck, ArrowRight, Zap, BarChart3, ChefHat, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-primary/10 bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-md">
              <UtensilsCrossed className="w-5 h-5 text-accent" />
            </div>
            <div>
              <span className="font-extrabold text-primary text-lg tracking-tight">SmartBite</span>
              <span className="text-xs ml-1.5 px-2 py-0.5 rounded-full bg-accent/20 text-primary font-bold">SaaS</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-primary hover:bg-primary/5 transition-all"
            >
              Staff Login
            </Link>
            <Link
              href="/admin/login"
              className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5"
            >
              Admin Portal
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold mx-auto mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Next-Gen Smart Restaurant & Hotel Management Solution
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-primary tracking-tight leading-tight mb-6 max-w-4xl mx-auto">
          Delight Your Diners, Streamline Orders & Boost Revenue.
        </h1>

        <p className="text-base sm:text-xl text-textPrimary/80 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Contactless QR dining with multi-round reordering, instant live kitchen notifications via WebSockets, online UPI/Card checkout, and real-time revenue analytics.
        </p>

        {/* Action cards */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto w-full mb-12">
          {/* Customer Portal Card */}
          <div className="card p-6 text-left hover:shadow-xl transition-all border-2 border-secondary/20 hover:border-secondary flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-4">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Customer Ordering Portal</h3>
              <p className="text-sm text-textPrimary/70 mb-4">
                Experience table dining from customer perspective. Scan QR, browse delicious categories, place orders, and pay bill.
              </p>
            </div>
            <Link
              href="/admin/tables"
              className="btn-primary w-full text-center text-sm py-3 flex items-center justify-center gap-2"
            >
              Scan Any Table QR
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Admin Dashboard Card */}
          <div className="card p-6 text-left hover:shadow-xl transition-all border-2 border-primary/20 hover:border-primary flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Hotel Admin Dashboard</h3>
              <p className="text-sm text-textPrimary/70 mb-4">
                Approve orders, manage menu & categories, generate QR codes, collect counter/online payments & view revenue charts.
              </p>
            </div>
            <Link
              href="/admin/login"
              className="bg-primary text-white font-bold w-full text-center text-sm py-3 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
            >
              Enter Admin Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto w-full">
          {[
            { icon: Zap, label: 'Instant Socket Notifications' },
            { icon: QrCode, label: 'Dynamic Table QR Codes' },
            { icon: ShieldCheck, label: 'Multi-Tenant SaaS Data' },
            { icon: BarChart3, label: 'Daily/Weekly Analytics' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white/80 border border-primary/10 rounded-xl p-3 flex items-center gap-2.5 text-left">
              <item.icon className="w-4 h-4 text-secondary flex-shrink-0" />
              <span className="text-xs font-semibold text-primary">{item.label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/10 bg-white/40 py-6 text-center text-xs text-textPrimary/60">
        <p>© 2026 Smart Restaurant & Hotel SaaS Platform. Built for commercial multi-hotel deployments.</p>
      </footer>
    </div>
  );
}
