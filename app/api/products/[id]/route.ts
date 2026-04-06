/**
 * API Route: /api/products/[id]
 * Thin controller — delegates to ProductService.
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { productService } from '@/services';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import type { IProductUpdateInput } from '@/types/service.types';

// ─── PATCH /api/products/[id] ──────────────────────────────────────────────

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
    await connectDB();

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const specsRaw = formData.get('specs') as string;
    const categoryId = formData.get('categoryId') as string;
    const basePriceStr = formData.get('basePrice');
    const basePrice = basePriceStr !== null ? Number(basePriceStr) : undefined;
    const imageFiles = formData.getAll('images') as File[];
    const retainedImageIdsRaw = formData.get('retainedImageIds') as string;
    let retainedImageIds: string[] = [];
    if (retainedImageIdsRaw) {
      try {
        retainedImageIds = JSON.parse(retainedImageIdsRaw);
      } catch (e) {
        // ignore
      }
    }

    // Get existing product to handle images
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy sản phẩm' },
        { status: 404 }
      );
    }

    const existingImages = existingProduct.images || [];
    let updatedImages = [];

    // Combine old .image migration compatibility
    let oldImages = existingImages.length > 0 ? existingImages : (existingProduct.image ? [existingProduct.image] : []);

    // 1. Delete images that are not retained
    for (const oldImg of oldImages) {
      if (oldImg.public_id && retainedImageIds.includes(oldImg.public_id)) {
        updatedImages.push(oldImg);
      } else if (oldImg.public_id) {
        try {
          await deleteImage(oldImg.public_id);
        } catch (e) {
          console.error("Failed to delete image from Cloudinary", e);
        }
      }
    }

    // 2. Upload new images
    for (const file of imageFiles) {
      if (file && file.size > 0 && typeof file !== 'string') {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;
        const uploadResult = await uploadImage(base64Image, 'products');
        if (uploadResult.success) {
          updatedImages.push({
            public_id: uploadResult.public_id,
            url: uploadResult.url,
            secure_url: uploadResult.secure_url || uploadResult.url,
          });
        }
      }
    }

    const input: IProductUpdateInput = {
      images: updatedImages.length > 0 ? updatedImages : null,
    };

    if (name) input.name = name;
    if (categoryId) input.categoryId = categoryId;
    if (basePrice !== undefined) input.basePrice = basePrice;
    if (specsRaw) {
      try {
        input.specs = JSON.parse(specsRaw);
      } catch (e) {
        return NextResponse.json(
          { success: false, message: 'Định dạng specs không hợp lệ (phải là JSON string)' },
          { status: 400 }
        );
      }
    }

    const result = await productService.update(id, input);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    // Revalidation (Route concern)
    try {
      const slug = await productService.getCategorySlugById(categoryId);
      if (slug) {
        revalidatePath(`/${slug}`);
        revalidateTag(`products-${slug}`);
      }
      if (existingProduct.categoryId.toString() !== categoryId) {
        const oldSlug = await productService.getCategorySlugById(
          existingProduct.categoryId.toString()
        );
        if (oldSlug) {
          revalidatePath(`/${oldSlug}`);
          revalidateTag(`products-${oldSlug}`);
        }
        revalidateTag('categories-list');
      }
    } catch (e) {
      console.error('Lỗi revalidate:', e);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật Product:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server', error: error.message },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/products/[id] ─────────────────────────────────────────────

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
    await connectDB();

    // Get product for Cloudinary cleanup and revalidation (Route concern)
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy sản phẩm' },
        { status: 404 }
      );
    }

    // Cleanup Cloudinary images (Route concern)
    const imagesToDelete = product.images?.length > 0 ? product.images : (product.image ? [product.image] : []);
    for (const img of imagesToDelete) {
      if (img.public_id) {
        await deleteImage(img.public_id);
      }
    }

    const result = await productService.delete(id);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    // Revalidation
    try {
      const slug = await productService.getCategorySlugById(
        product.categoryId.toString()
      );
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
    console.error('Lỗi khi xóa Product:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server', error: error.message },
      { status: 500 }
    );
  }
}
