'use client';

import React from 'react';
import AdminGuard from './AdminGuard';
import AdminSidebar from './AdminSidebar';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-cream">
        <AdminSidebar />
        <main className="lg:pl-64 flex flex-col min-h-screen w-full min-w-0">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
