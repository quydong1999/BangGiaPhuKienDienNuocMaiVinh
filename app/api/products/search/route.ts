/**
 * API Route: /api/products/search
 * Thin controller — delegates to ProductService.search().
 */

import { NextResponse } from 'next/server';
import { productService } from '@/services';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    const result = await productService.search(query);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Search Error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi tìm kiếm sản phẩm' },
      { status: 500 }
    );
  }
}