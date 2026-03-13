import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import mongoose from 'mongoose'; // Cần để convert string sang ObjectId nếu cần

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ success: true, data: [] });
        }

        const results = await Product.aggregate([
            // Bước 1: Tìm kiếm bằng Atlas Search
            {
                $search: {
                    index: "product-search",
                    compound: {
                        should: [
                            {
                                text: {
                                    query: query,
                                    path: "name",
                                    fuzzy: { maxEdits: 1 },
                                    score: { boost: { value: 3 } }
                                }
                            },
                            {
                                text: {
                                    query: query,
                                    path: ["spec", "name.raw"],
                                    fuzzy: { maxEdits: 1 }
                                }
                            }
                        ]
                    }
                }
            },
            // Bước 2: Giới hạn kết quả trước khi Join để tối ưu hiệu năng
            { $limit: 15 },

            // Bước 3: Join với collection categories
            {
                $lookup: {
                    from: "categories",       // Tên collection danh mục trong DB
                    localField: "categoryId",  // Field trong collection Product
                    foreignField: "_id",      // Field trong collection Category
                    as: "categoryInfo"         // Tên mảng chứa kết quả join
                }
            },

            // Bước 4: Chuyển mảng categoryInfo thành object (vì mỗi sp chỉ thuộc 1 danh mục)
            {
                $unwind: {
                    path: "$categoryInfo",
                    preserveNullAndEmptyArrays: true // Giữ lại sp nếu lỡ category bị xóa
                }
            },

            // Bước 5: Chọn các field cần trả về và lấy categoryName
            {
                $project: {
                    _id: 1,
                    name: 1,
                    spec: 1,
                    unit: 1,
                    priceSell: 1,
                    image: 1,
                    categoryId: 1,
                    categoryName: "$categoryInfo.title", // Lấy trường title từ categoryInfo
                    categoryShortTitle: "$categoryInfo.shortTitle",
                    categorySlug: "$categoryInfo.slug",
                    layout: "$categoryInfo.layout",
                    score: { $meta: "searchScore" }
                }
            }
        ]);

        return NextResponse.json({
            success: true,
            data: results
        });

    } catch (error: any) {
        console.error("Search Join Error:", error);
        return NextResponse.json(
            { success: false, message: "Lỗi khi lấy thông tin danh mục" },
            { status: 500 }
        );
    }
}