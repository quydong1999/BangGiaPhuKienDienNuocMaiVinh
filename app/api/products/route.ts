/**
 * API Route: /api/products
 * Thin controller — delegates to ProductService.
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { productService } from '@/services';
import { uploadImage } from '@/lib/cloudinary';
import type { IProductCreateInput } from '@/types/service.types';

// ─── GET /api/products?categoryId=xxx ──────────────────────────────────────

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId') || undefined;

    const result = await productService.findAll(categoryId);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Lỗi API Products GET:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ─── POST /api/products ────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const spec = formData.get('spec') as string;
    const unit = formData.get('unit') as string;
    const priceSell = formData.get('priceSell') as string;
    const categoryId = formData.get('categoryId') as string;
    const imageFile = formData.get('image') as File | null;

    // Handle image upload (Cloudinary concern stays in Route)
    let imageData = null;
    if (imageFile && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Image = `data:${imageFile.type};base64,${buffer.toString('base64')}`;
      const uploadResult = await uploadImage(base64Image, 'products');
      if (uploadResult.success) {
        imageData = {
          public_id: uploadResult.public_id,
          url: uploadResult.url,
          secure_url: uploadResult.secure_url || uploadResult.url,
        };
      } else {
        throw new Error('Lỗi upload hình ảnh lên Cloudinary');
      }
    }

    const input: IProductCreateInput = {
      name,
      spec,
      unit,
      priceSell,
      categoryId,
      image: imageData,
    };

    const result = await productService.create(input);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // Revalidation (Route concern)
    try {
      const slug = await productService.getCategorySlugById(categoryId);
      if (slug) {
        revalidatePath(`/${slug}`);
        revalidateTag(`products-${slug}`);
      }
    } catch (e) {
      console.error('Lỗi revalidate:', e);
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Lỗi khi tạo Product:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server', error: error.message },
      { status: 500 }
    );
  }
}
