import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
import { uploadImage } from '@/lib/cloudinary';

export async function GET() {
  try {
    console.log("--- Đang thử kết nối DB... ---");
    await connectDB();

    console.log("--- Đang truy vấn Categories... ---");
    const categories = await Category.find({});

    return NextResponse.json({
      success: true,
      count: categories.length,
      data: categories
    }, { status: 200 });

  } catch (error: any) {
    console.error("Lỗi API:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    // 1. Lấy dữ liệu từ FormData thay vì JSON
    const formData = await req.formData();

    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const shortTitle = formData.get('shortTitle') as string;
    const filterField = formData.get('filterField') as string;
    const layout = formData.get('layout') as string;

    // Xử lý mảng visibleFields (Thunder Client gửi dưới dạng nhiều key cùng tên hoặc chuỗi JSON)
    const visibleFieldsRaw = formData.getAll('visibleFields');
    const visibleFields = visibleFieldsRaw.length > 0 ? visibleFieldsRaw : [];

    const imageFile = formData.get('image') as File | null;

    // 2. Kiểm tra bắt buộc
    if (!slug || !title) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin slug hoặc title" },
        { status: 400 }
      );
    }

    // 3. Kiểm tra trùng slug
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return NextResponse.json(
        { success: false, message: "Slug này đã tồn tại rồi!" },
        { status: 409 }
      );
    }

    // 4. Xử lý Upload Ảnh lên Cloudinary
    let imageData = null;
    if (imageFile && imageFile.size > 0) {
      // Chuyển đổi File sang Base64 để gửi lên Cloudinary
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

    // 5. Tạo Object dữ liệu để lưu vào MongoDB
    const categoryToCreate = {
      title,
      slug,
      shortTitle,
      filterField,
      layout,
      visibleFields,
      image: imageData // Lưu object ảnh nếu có
    };

    const newCategory = await Category.create(categoryToCreate);

    // Revalidate the homepage to show the new category
    revalidatePath('/');

    return NextResponse.json(
      {
        success: true,
        message: "Tạo danh mục thành công",
        data: newCategory
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Lỗi khi tạo Category:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server", error: error.message },
      { status: 500 }
    );
  }
}