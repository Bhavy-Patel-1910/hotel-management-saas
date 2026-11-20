'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UtensilsCrossed, Loader2 } from 'lucide-react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-primary text-accent mx-auto mb-4 flex items-center justify-center shadow-lg animate-pulse">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-center gap-2 text-primary font-semibold text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-secondary" />
            <span>Authenticating Admin Session...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
