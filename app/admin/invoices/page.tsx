import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import InvoicesListClient from './InvoicesListClient';

export default async function InvoicesAdminPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect('/');
  }


  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-800 uppercase">Hóa đơn</h1>
        </div>
      </div>
      <Suspense fallback={
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-[42px] bg-slate-100 rounded-lg w-full"></div>
          <div className="h-[400px] bg-slate-50 rounded-lg w-full"></div>
        </div>
      }>
        <InvoicesListClient />
      </Suspense>
    </div>
  );
}
