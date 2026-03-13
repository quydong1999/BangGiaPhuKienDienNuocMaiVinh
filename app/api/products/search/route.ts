import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import mongoose from 'mongoose';
import { redis, CACHE_KEYS, DEFAULT_TTL } from '@/lib/redis';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ success: true, data: [] });
        }

        // 1. Thử lấy từ Redis
        console.log(`--- Đang kiểm tra cache Redis cho Search: ${query}... ---`);
        const cachedResults = await redis.get(CACHE_KEYS.SEARCH_QUERY(query));

        if (cachedResults) {
            console.log(`--- Cache Hit! Trả về dữ liệu từ Redis cho query: ${query}. ---`);
            return NextResponse.json({
                success: true,
                data: cachedResults,
                source: 'cache'
            }, { status: 200 });
        }

        console.log(`--- Cache Miss! Đang thực hiện tìm kiếm MongoDB cho query: ${query}... ---`);
        await connectDB();

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
            { $limit: 30 },

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

        // 2. Lưu vào Redis (TTL ngắn hơn cho tìm kiếm?)
        console.log(`--- Đang lưu kết quả Search cho query: ${query} vào Redis... ---`);
        await redis.set(CACHE_KEYS.SEARCH_QUERY(query), results, { ex: 1800 }); // 30 phút

        return NextResponse.json({
            success: true,
            data: results,
            source: 'database'
        });

    } catch (error: any) {
        console.error("Search Join Error:", error);
        return NextResponse.json(
            { success: false, message: "Lỗi khi lấy thông tin danh mục" },
            { status: 500 }
        );
    }
}