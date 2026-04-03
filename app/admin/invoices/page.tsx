import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { invoiceService } from '@/services';
import InvoicesListClient from './InvoicesListClient';

export default async function InvoicesAdminPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const invoices = await invoiceService.findAll();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-800 uppercase">Hóa đơn</h1>
        </div>
      </div>
      <InvoicesListClient initialInvoices={JSON.parse(JSON.stringify(invoices))} />
    </div>
  );
}
