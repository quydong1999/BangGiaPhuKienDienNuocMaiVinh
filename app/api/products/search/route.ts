/**
 * API Route: /api/products/search
 * Thin controller — delegates to ProductService.search().
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { productService } from '@/services';

export async function GET(req: Request) {
  try {
    const session = await auth();
    const isAdmin = session?.user?.isAdmin === true;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    const result = await productService.search(query);

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
    console.error('Search Error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi tìm kiếm sản phẩm' },
      { status: 500 }
    );
  }
}