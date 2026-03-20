import { auth } from "@/auth"
import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { redis, CACHE_KEYS } from '@/lib/redis';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await connectDB();
        const { id } = await params;

        const formData = await req.formData();
        const name = formData.get('name') as string;
        const spec = formData.get('spec') as string;
        const unit = formData.get('unit') as string;
        const priceSell = formData.get('priceSell') as string;
        const categoryId = formData.get('categoryId') as string;
        const imageFile = formData.get('image') as File | null;

        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return NextResponse.json(
                { success: false, message: "Không tìm thấy sản phẩm" },
                { status: 404 }
            );
        }

        let imageData = existingProduct.image;

        // Xử lý hình ảnh nếu có file mới
        if (imageFile && imageFile.size > 0 && typeof imageFile !== 'string') {
            // Xóa ảnh cũ trên Cloudinary nếu có
            if (existingProduct.image?.public_id) {
                await deleteImage(existingProduct.image.public_id);
            }

            // Upload ảnh mới
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

        const updateData: any = {
            name,
            spec,
            unit,
            priceSell,
            categoryId,
            image: imageData
        };

        const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });

        // 6. Xóa cache Redis
        console.log(`--- Đang xóa cache Redis cho Products của category: ${categoryId}... ---`);
        await redis.del(CACHE_KEYS.PRODUCTS_BY_CATEGORY(categoryId));
        await redis.del(CACHE_KEYS.PRODUCTS_ALL);

        if (existingProduct.categoryId.toString() !== categoryId) {
            console.log(`--- Đang xóa cache Redis cho Products của category cũ: ${existingProduct.categoryId}... ---`);
            await redis.del(CACHE_KEYS.PRODUCTS_BY_CATEGORY(existingProduct.categoryId.toString()));
        }

        // Revalidate
        try {
            const category = await Category.findById(categoryId);
            if (category) {
                revalidatePath(`/${category.slug}`);
                revalidateTag(`products-${category.slug}`);
            }
            // Cũng revalidate category cũ nếu nó khác category mới
            if (existingProduct.categoryId.toString() !== categoryId) {
                const oldCategory = await Category.findById(existingProduct.categoryId);
                if (oldCategory) {
                    revalidatePath(`/${oldCategory.slug}`);
                    revalidateTag(`products-${oldCategory.slug}`);
                }
            }
        } catch (revalidateError) {
            console.error("Lỗi revalidate:", revalidateError);
        }

        return NextResponse.json(
            {
                success: true,
                message: "Cập nhật sản phẩm thành công",
                data: updatedProduct
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("Lỗi khi cập nhật Product:", error);
        return NextResponse.json(
            { success: false, message: "Lỗi server", error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await connectDB();
        const { id } = await params;

        const productToDelete = await Product.findById(id);
        if (!productToDelete) {
            return NextResponse.json(
                { success: false, message: "Không tìm thấy sản phẩm" },
                { status: 404 }
            );
        }

        // Xóa hình ảnh trên Cloudinary
        if (productToDelete.image?.public_id) {
            await deleteImage(productToDelete.image.public_id);
        }

        await Product.findByIdAndDelete(id);

        // 6. Xóa cache Redis
        const categoryId = productToDelete.categoryId.toString();
        console.log(`--- Đang xóa cache Redis cho Products của category: ${categoryId}... ---`);
        await redis.del(CACHE_KEYS.PRODUCTS_BY_CATEGORY(categoryId));
        await redis.del(CACHE_KEYS.PRODUCTS_ALL);

        // Revalidate
        try {
            const category = await Category.findById(productToDelete.categoryId);
            if (category) {
                revalidatePath(`/${category.slug}`);
                revalidateTag(`products-${category.slug}`);
            }
        } catch (revalidateError) {
            console.error("Lỗi revalidate:", revalidateError);
        }

        return NextResponse.json(
            {
                success: true,
                message: "Xóa sản phẩm thành công"
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("Lỗi khi xóa Product:", error);
        return NextResponse.json(
            { success: false, message: "Lỗi server", error: error.message },
            { status: 500 }
        );
    }
}
