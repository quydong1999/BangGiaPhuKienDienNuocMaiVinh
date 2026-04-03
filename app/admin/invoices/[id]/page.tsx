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
      <div className="max-w-4xl mx-auto">
        <InvoiceDetailClient initialInvoice={JSON.parse(JSON.stringify(invoice))} />
      </div>
    </div>
  );
}
