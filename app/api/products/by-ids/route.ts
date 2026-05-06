import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { productService } from '@/services';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const isAdmin = session?.user?.isAdmin === true;
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { success: false, message: 'Invalid format, ids must be an array' },
        { status: 400 }
      );
    }

    const result = await productService.findByIds(ids);

    if (!isAdmin && result.success && result.data) {
      result.data = result.data.map(product => {
        const specs = product.specs?.map((spec: any) => ({
          ...spec,
          prices: spec.prices?.map((price: any) => {
            const { basePrice, ...rest } = price;
            return rest;
          })
        }));
        return { ...product, specs };
      }) as any;
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Lỗi API Products by-ids POST:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
