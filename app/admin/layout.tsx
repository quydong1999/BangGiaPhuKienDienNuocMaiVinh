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
    <div className="flex min-h-screen bg-slate-50">
      <AdminNav user={session.user} />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col">
        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
