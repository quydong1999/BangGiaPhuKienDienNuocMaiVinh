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
    const spec = formData.get('spec') as string;
    const unit = formData.get('unit') as string;
    const priceSell = formData.get('priceSell') as string;
    const categoryId = formData.get('categoryId') as string;
    const imageFile = formData.get('image') as File | null;

    // Get existing product to handle image
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy sản phẩm' },
        { status: 404 }
      );
    }

    let imageData = existingProduct.image;

    // Handle image upload (Cloudinary concern stays in Route)
    if (imageFile && imageFile.size > 0 && typeof imageFile !== 'string') {
      if (existingProduct.image?.public_id) {
        await deleteImage(existingProduct.image.public_id);
      }
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

    const input: IProductUpdateInput = {
      name,
      spec,
      unit,
      priceSell,
      categoryId,
      image: imageData,
    };

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

    // Cleanup Cloudinary image (Route concern)
    if (product.image?.public_id) {
      await deleteImage(product.image.public_id);
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
