/**
 * API Route: /api/products/bulk-import
 * Nhập hàng loạt sản phẩm từ CSV.
 * Thin controller — delegates to ProductService.bulkImport().
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { productService } from '@/services';
import type { IBulkImportRow } from '@/types/service.types';

// ─── POST /api/products/bulk-import ────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { categoryId, rows } = body as {
      categoryId: string;
      rows: IBulkImportRow[];
    };

    // Validate input
    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu categoryId' },
        { status: 400 }
      );
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Không có dữ liệu để import' },
        { status: 400 }
      );
    }

    // Filter out 'unchanged' rows — chỉ gửi rows có thay đổi
    const actionableRows = rows.filter(r => r.action !== 'unchanged');

    if (actionableRows.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'Không có thay đổi nào cần thực hiện',
          data: {
            productsCreated: 0,
            specsAdded: 0,
            pricesAdded: 0,
            pricesUpdated: 0,
            totalProcessed: 0,
          },
        },
        { status: 200 }
      );
    }

    const result = await productService.bulkImport(categoryId, actionableRows);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // Revalidation (Route concern)
    try {
      const slug = await productService.getCategorySlugById(categoryId);
      if (slug) {
        revalidatePath(`/${slug}`);
        revalidateTag(`products-${slug}`);
        revalidateTag('categories-list');
      }
    } catch (e) {
      console.error('Lỗi revalidate:', e);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Lỗi API bulk-import:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server', error: error.message },
      { status: 500 }
    );
  }
}
