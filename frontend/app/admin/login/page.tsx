'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, UtensilsCrossed, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@spicegardenrestaurant.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully!');
      router.push('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const setRoleDemo = (role: 'admin' | 'waiter') => {
    if (role === 'admin') {
      setEmail('admin@spicegardenrestaurant.com');
      setPassword('Admin@123');
    } else {
      setEmail('waiter@spicegardenrestaurant.com');
      setPassword('Waiter@123');
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-primary text-accent mx-auto mb-4 flex items-center justify-center shadow-xl">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-primary tracking-tight">SmartBite Portal</h1>
          <p className="text-sm text-textPrimary/70 mt-1 font-medium">
            Smart Restaurant & Hotel Management SaaS
          </p>
        </div>

        {/* Card */}
        <div className="card p-8 shadow-xl border border-primary/10">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-primary">Staff Sign In</h2>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setRoleDemo('admin')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-all flex items-center gap-1"
                title="Fill Admin demo credentials"
              >
                <ShieldCheck className="w-3 h-3 text-secondary" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => setRoleDemo('waiter')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-secondary/10 text-secondary font-bold hover:bg-secondary/20 transition-all flex items-center gap-1"
                title="Fill Waiter demo credentials"
              >
                <UserCheck className="w-3 h-3 text-secondary" />
                Waiter
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10 text-sm"
                  placeholder="admin@hotel.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10 text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 mt-2 shadow-lg"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-textPrimary/60">
              Demo Credentials Pre-filled: <br />
              <span className="font-semibold text-primary">admin@spicegardenrestaurant.com</span> / <span className="font-semibold text-primary">Admin@123</span>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs font-semibold text-secondary hover:underline">
            ← Return to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
