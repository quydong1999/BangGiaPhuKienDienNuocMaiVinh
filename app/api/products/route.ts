import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { uploadImage } from '@/lib/cloudinary';

export async function GET(req: Request) {
    try {
        console.log("--- Đang thử kết nối DB... ---");
        await connectDB();

        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get('categoryId');

        const filter: any = {};
        if (categoryId) {
            filter.categoryId = categoryId;
        }

        console.log("--- Đang truy vấn Products... ---");
        const products = await Product.find(filter).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            count: products.length,
            data: products
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

        const formData = await req.formData();

        const name = formData.get('name') as string;
        const spec = formData.get('spec') as string;
        const unit = formData.get('unit') as string;
        const priceSell = formData.get('priceSell') as string;
        const categoryId = formData.get('categoryId') as string;
        const imageFile = formData.get('image') as File | null;

        if (!name || !priceSell || !categoryId) {
            return NextResponse.json(
                { success: false, message: "Thiếu thông tin bắt buộc (tên, giá bán hoặc danh mục)" },
                { status: 400 }
            );
        }

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
                    secure_url: uploadResult.secure_url || uploadResult.url
                };
            } else {
                throw new Error("Lỗi upload hình ảnh lên Cloudinary");
            }
        }

        const productToCreate = {
            name,
            spec,
            unit,
            priceSell,
            categoryId,
            image: imageData
        };

        const newProduct = await Product.create(productToCreate);

        // Revalidate the category page
        try {
            const category = await Category.findById(categoryId);
            if (category) {
                revalidatePath(`/${category.slug}`);
            }
        } catch (revalidateError) {
            console.error("Lỗi revalidate:", revalidateError);
        }

        return NextResponse.json(
            {
                success: true,
                message: "Tạo sản phẩm thành công",
                data: newProduct
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error("Lỗi khi tạo Product:", error);
        return NextResponse.json(
            { success: false, message: "Lỗi server", error: error.message },
            { status: 500 }
        );
    }
}
