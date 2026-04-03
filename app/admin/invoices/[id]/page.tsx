import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { invoiceService } from '@/services';
import InvoiceDetailClient from './InvoiceDetailClient';

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const invoice = await invoiceService.findById(id);
  if (!invoice) {
    notFound();
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-800 uppercase">{`Chi tiết hóa đơn số: ${invoice.invoiceNumber}`}</h1>
        </div>
      </div>
      <InvoiceDetailClient initialInvoice={JSON.parse(JSON.stringify(invoice))} />
    </div>
  );
}
