import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AdminNav from './AdminNav';
import React from 'react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/');
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <AdminNav user={session.user} />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col overflow-hidden">
        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 lg:p-6 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
