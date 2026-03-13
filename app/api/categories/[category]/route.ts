import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
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
