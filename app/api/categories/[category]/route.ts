/**
 * API Route: /api/categories/[category]
 * Thin controller — delegates to CategoryService.
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CategoryService } from '@/services/CategoryService';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import type { ICategoryUpdateInput } from '@/types/service.types';

// ─── GET /api/categories/[category] ────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;
    const result = await CategoryService.findBySlug(category);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/categories/[category] ──────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { category } = await params;

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const shortTitle = formData.get('shortTitle') as string;
    const layout = formData.get('layout') as string;
    const filterField = formData.get('filterField') as string;
    const visibleFieldsRaw = formData.getAll('visibleFields') as string[];
    const visibleFields = visibleFieldsRaw.length > 0 ? visibleFieldsRaw : [];
    const imageFile = formData.get('image') as File | null;

    // Handle image (Cloudinary concern stays in Route)
    const existingImage = await CategoryService.getExistingImage(category);
    let imageData = existingImage;

    if (imageFile && imageFile.size > 0 && typeof imageFile !== 'string') {
      if (existingImage?.public_id) {
        await deleteImage(existingImage.public_id);
      }
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

    const input: ICategoryUpdateInput = {
      title,
      slug,
      shortTitle,
      layout,
      filterField,
      visibleFields,
      image: imageData,
    };

    const result = await CategoryService.update(category, input);

    if (!result.success) {
      const status = result.message?.includes('tồn tại')
        ? 409
        : result.message?.includes('Không tìm thấy')
          ? 404
          : 400;
      return NextResponse.json(result, { status });
    }

    // Revalidation (Route concern)
    try {
      revalidatePath('/');
      revalidateTag('categories-list');
      revalidatePath(`/${category}`);
      revalidateTag(`category-${category}`);
      if (slug !== category) {
        revalidatePath(`/${slug}`);
        revalidateTag(`category-${slug}`);
      }
    } catch (err) {
      console.error('Lỗi revalidate:', err);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật Category:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server', error: error.message },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/categories/[category] ─────────────────────────────────────

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { category } = await params;

    // Get image data for Cloudinary cleanup (Route concern)
    const existingImage = await CategoryService.getExistingImage(category);

    const result = await CategoryService.delete(category);

    if (!result.success) {
      const status = result.message?.includes('Không tìm thấy')
        ? 404
        : result.message?.includes('chứa sản phẩm')
          ? 400
          : 500;
      return NextResponse.json(result, { status });
    }

    // Cleanup Cloudinary image (Route concern)
    if (existingImage?.public_id) {
      await deleteImage(existingImage.public_id);
    }

    // Revalidation
    try {
      revalidatePath('/');
      revalidateTag('categories-list');
      revalidatePath(`/${category}`);
      revalidateTag(`category-${category}`);
    } catch (err) {
      console.error('Lỗi revalidate:', err);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Lỗi khi xóa Category:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server', error: error.message },
      { status: 500 }
    );
  }
}
