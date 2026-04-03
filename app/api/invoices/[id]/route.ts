import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { invoiceService } from '@/services';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const invoice = await invoiceService.findById(id);

    if (!invoice) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
      const data = await req.json();
  
      if (Object.keys(data).length === 0) {
          return NextResponse.json({ error: 'No data provided' }, { status: 400 });
      }
  
      const invoice = await invoiceService.update(id, data);
  
      if (!invoice) {
          return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
  
      return NextResponse.json(invoice);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    try {
      const session = await auth();
      if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
  
      const { id } = await params;
      await invoiceService.delete(id);
  
      return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
