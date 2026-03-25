/**
 * API Route: /api/categories
 * Thin controller — delegates to CategoryService.
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { categoryService } from '@/services';
import { uploadImage } from '@/lib/cloudinary';
import type { ICategoryCreateInput } from '@/types/service.types';

// ─── GET /api/categories ───────────────────────────────────────────────────

export async function GET() {
  try {
    const result = await categoryService.findAll();
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Lỗi API Categories GET:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ─── POST /api/categories ──────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const shortTitle = formData.get('shortTitle') as string;
    const filterField = formData.get('filterField') as string;
    const layout = formData.get('layout') as string;
    const visibleFieldsRaw = formData.getAll('visibleFields') as string[];
    const visibleFields = visibleFieldsRaw.length > 0 ? visibleFieldsRaw : [];
    const imageFile = formData.get('image') as File | null;

    // Handle image upload (Cloudinary concern stays in Route)
    let imageData = null;
    if (imageFile && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Image = `data:${imageFile.type};base64,${buffer.toString('base64')}`;
      const uploadResult = await uploadImage(base64Image, 'categories');
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

    const input: ICategoryCreateInput = {
      title,
      slug,
      shortTitle,
      filterField,
      layout,
      visibleFields,
      image: imageData,
    };

    const result = await categoryService.create(input);

    if (!result.success) {
      const status = result.message?.includes('tồn tại') ? 409 : 400;
      return NextResponse.json(result, { status });
    }

    // Revalidation (Route concern)
    revalidatePath('/');
    revalidateTag('categories-list');

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Lỗi khi tạo Category:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server', error: error.message },
      { status: 500 }
    );
  }
}