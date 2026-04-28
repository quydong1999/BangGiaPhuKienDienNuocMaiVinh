import { NextResponse } from 'next/server';
import { productService } from '@/services';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { success: false, message: 'Invalid format, ids must be an array' },
        { status: 400 }
      );
    }

    const result = await productService.findByIds(ids);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Lỗi API Products by-ids POST:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
