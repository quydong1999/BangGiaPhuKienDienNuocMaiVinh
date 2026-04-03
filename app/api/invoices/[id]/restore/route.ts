import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { invoiceService } from '@/services';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    try {
      const session = await auth();
      if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
  
      const { id } = await params;
      const invoice = await invoiceService.restore(id);
  
      if (!invoice) {
          return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
  
      return NextResponse.json(invoice);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
