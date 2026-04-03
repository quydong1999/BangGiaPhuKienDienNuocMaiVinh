import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { invoiceService } from '@/services';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const invoices = await invoiceService.findDeleted();
    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
