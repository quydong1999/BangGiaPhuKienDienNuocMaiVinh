import { auth } from "@/auth"
import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { redis, CACHE_KEYS, DEFAULT_TTL } from '@/lib/redis';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;

    // 1. Thử lấy từ Redis
    console.log(`--- Đang kiểm tra cache Redis cho Category: ${category}... ---`);
    const cachedCategory = await redis.get(CACHE_KEYS.CATEGORY_BY_SLUG(category));

    if (cachedCategory) {
      console.log(`--- Cache Hit! Trả về dữ liệu từ Redis cho ${category}. ---`);
      return NextResponse.json({
        success: true,
        data: cachedCategory,
        source: 'cache'
      }, { status: 200 });
    }

    console.log(`--- Cache Miss! Đang thử kết nối DB cho ${category}... ---`);
    await connectDB();

    const categoryData = await Category.findOne({ slug: category });

    if (!categoryData) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }

    // 2. Lưu vào Redis
    console.log(`--- Đang lưu Category ${category} vào Redis... ---`);
    await redis.set(CACHE_KEYS.CATEGORY_BY_SLUG(category), categoryData, { ex: DEFAULT_TTL });

    return NextResponse.json({
      success: true,
      data: categoryData,
      source: 'database'
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { category } = await params;
    await connectDB();

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const shortTitle = formData.get('shortTitle') as string;
    const layout = formData.get('layout') as string;
    const filterField = formData.get('filterField') as string;

    // Xử lý visibleFields
    const visibleFieldsRaw = formData.getAll('visibleFields');
    const visibleFields = visibleFieldsRaw.length > 0 ? visibleFieldsRaw : [];

    const imageFile = formData.get('image') as File | null;

    if (!slug || !title) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin slug hoặc title" },
        { status: 400 }
      );
    }

    const existingCategory = await Category.findOne({ slug: category });
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy danh mục" },
        { status: 404 }
      );
    }

    // Nếu thay đổi slug, kiểm tra trùng lặp
    if (slug !== category) {
      const slugExists = await Category.findOne({ slug });
      if (slugExists) {
        return NextResponse.json(
          { success: false, message: "Slug này đã tồn tại!" },
          { status: 409 }
        );
      }
    }

    let imageData = existingCategory.image;

    // Xử lý hình ảnh nếu có file mới
    if (imageFile && imageFile.size > 0 && typeof imageFile !== 'string') {
      // Xóa ảnh cũ trên Cloudinary nếu có
      if (existingCategory.image?.public_id) {
        await deleteImage(existingCategory.image.public_id);
      }

      // Upload ảnh mới
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Image = `data:${imageFile.type};base64,${buffer.toString('base64')}`;

      const uploadResult = await uploadImage(base64Image, 'categories');

      if (uploadResult.success) {
        imageData = {
          public_id: uploadResult.public_id,
          url: uploadResult.url,
          secure_url: uploadResult.secure_url || uploadResult.url
        };
      } else {
        throw new Error("Lỗi upload hình ảnh lên Cloudinary");
      }
    }

    const updateData = {
      title,
      slug,
      shortTitle,
      layout,
      filterField,
      visibleFields,
      image: imageData
    };

    const updatedCategory = await Category.findByIdAndUpdate(existingCategory._id, updateData, { new: true });

    // Xóa cache Redis
    console.log(`--- Đang xóa cache Redis cho Category: ${category}... ---`);
    await redis.del(CACHE_KEYS.CATEGORIES_ALL);
    await redis.del(CACHE_KEYS.CATEGORY_BY_SLUG(category));
    if (slug !== category) {
      await redis.del(CACHE_KEYS.CATEGORY_BY_SLUG(slug));
    }

    // Revalidate
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
      console.error("Lỗi revalidate:", err);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Cập nhật danh mục thành công",
        data: updatedCategory
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Lỗi khi cập nhật Category:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { category } = await params;
    await connectDB();

    const categoryToDelete = await Category.findOne({ slug: category });

    if (!categoryToDelete) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy danh mục" },
        { status: 404 }
      );
    }

    // Kiểm tra xem có sản phẩm nào thuộc danh mục này không
    const productCount = await Product.countDocuments({ categoryId: categoryToDelete._id });
    if (productCount > 0) {
      return NextResponse.json(
        { success: false, message: "Không thể xóa. Danh mục này đang chứa sản phẩm!" },
        { status: 400 }
      );
    }

    // Xóa hình ảnh trên Cloudinary
    if (categoryToDelete.image?.public_id) {
      await deleteImage(categoryToDelete.image.public_id);
    }

    // Xóa Category
    await Category.findByIdAndDelete(categoryToDelete._id);

    // Xóa cache Redis
    console.log(`--- Đang xóa cache Redis cho Category: ${category}... ---`);
    await redis.del(CACHE_KEYS.CATEGORIES_ALL);
    await redis.del(CACHE_KEYS.CATEGORY_BY_SLUG(category));

    // Revalidate
    try {
      revalidatePath('/');
      revalidateTag('categories-list');
      revalidatePath(`/${category}`);
      revalidateTag(`category-${category}`);
    } catch (err) {
      console.error("Lỗi revalidate:", err);
    }

    return NextResponse.json(
      { success: true, message: "Xóa danh mục thành công" },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Lỗi khi xóa Category:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server", error: error.message },
      { status: 500 }
    );
  }
}

