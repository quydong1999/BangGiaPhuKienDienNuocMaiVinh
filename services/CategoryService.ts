/**
 * CategoryService
 *
 * Lớp Service xử lý toàn bộ logic nghiệp vụ cho Category.
 * Sử dụng Static Methods — sẵn sàng chuyển sang NestJS bằng cách thêm @Injectable().
 */

import { connectDB } from '@/lib/mongodb';
import { redis, CACHE_KEYS, DEFAULT_TTL } from '@/lib/redis';
import Category from '@/models/Category';
import Product from '@/models/Product';
import type {
  ICategory,
  ICategoryCreateInput,
  ICategoryUpdateInput,
  IServiceResponse,
  IListResponse,
} from '@/types/service.types';

export class CategoryService {
  private static instance: CategoryService;

  private constructor() {}

  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  // ─── GET ALL ──────────────────────────────────────────────────────────────

  async findAll(): Promise<IListResponse<ICategory>> {
    // 1. Cache check
    const cached = await redis.get(CACHE_KEYS.CATEGORIES_ALL);
    if (cached) {
      const data = cached as ICategory[];
      return { success: true, count: data.length, data, source: 'cache' };
    }

    // 2. DB query
    await connectDB();
    const categories = await Category.find({}).lean();

    // 3. Cache store
    await redis.set(CACHE_KEYS.CATEGORIES_ALL, categories, { ex: DEFAULT_TTL });

    return {
      success: true,
      count: categories.length,
      data: categories as ICategory[],
      source: 'database',
    };
  }

  // ─── GET BY SLUG ──────────────────────────────────────────────────────────

  async findBySlug(slug: string): Promise<IServiceResponse<ICategory>> {
    // 1. Cache check
    const cacheKey = CACHE_KEYS.CATEGORY_BY_SLUG(slug);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return { success: true, data: cached as ICategory };
    }

    // 2. DB query
    await connectDB();
    const category = await Category.findOne({ slug }).lean();
    if (!category) {
      return { success: false, message: 'Category not found' };
    }

    // 3. Cache store
    await redis.set(cacheKey, category, { ex: DEFAULT_TTL });

    return { success: true, data: category as ICategory };
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────

  async create(input: ICategoryCreateInput): Promise<IServiceResponse<ICategory>> {
    await connectDB();

    if (!input.slug || !input.title) {
      return { success: false, message: 'Thiếu thông tin slug hoặc title' };
    }

    // Check duplicate slug
    const existing = await Category.findOne({ slug: input.slug });
    if (existing) {
      return { success: false, message: 'Slug này đã tồn tại rồi!' };
    }

    const newCategory = await Category.create(input);

    // Invalidate cache
    await this.invalidateCache();

    return {
      success: true,
      message: 'Tạo danh mục thành công',
      data: newCategory.toObject() as ICategory,
    };
  }

  // ─── UPDATE (findOneAndUpdate, returnDocument: 'after') ──────────────────

  async update(
    currentSlug: string,
    input: ICategoryUpdateInput
  ): Promise<IServiceResponse<ICategory>> {
    await connectDB();

    if (!input.slug || !input.title) {
      return { success: false, message: 'Thiếu thông tin slug hoặc title' };
    }

    const existing = await Category.findOne({ slug: currentSlug });
    if (!existing) {
      return { success: false, message: 'Không tìm thấy danh mục' };
    }

    // Check slug conflict if changed
    if (input.slug !== currentSlug) {
      const slugExists = await Category.findOne({ slug: input.slug });
      if (slugExists) {
        return { success: false, message: 'Slug này đã tồn tại!' };
      }
    }

    const updated = await Category.findOneAndUpdate(
      { _id: existing._id },
      { $set: input },
      { returnDocument: 'after' }
    ).lean();

    if (!updated) {
      return { success: false, message: 'Cập nhật danh mục thất bại' };
    }

    // Invalidate cache
    await this.invalidateCache(currentSlug);
    if (input.slug && input.slug !== currentSlug) {
      await redis.del(CACHE_KEYS.CATEGORY_BY_SLUG(input.slug));
    }

    return {
      success: true,
      message: 'Cập nhật danh mục thành công',
      data: updated as ICategory,
    };
  }

  // ─── DELETE ──────────────────────────────────────────────────────────────

  async delete(slug: string): Promise<IServiceResponse<null>> {
    await connectDB();

    const category = await Category.findOne({ slug });
    if (!category) {
      return { success: false, message: 'Không tìm thấy danh mục' };
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ categoryId: category._id });
    if (productCount > 0) {
      return {
        success: false,
        message: 'Không thể xóa. Danh mục này đang chứa sản phẩm!',
      };
    }

    await Category.findByIdAndDelete(category._id);

    // Invalidate cache
    await this.invalidateCache(slug);

    return { success: true, message: 'Xóa danh mục thành công', data: null };
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  /**
   * Trả về image data của category hiện tại (để xử lý Cloudinary trong Route).
   */
  async getExistingImage(slug: string) {
    await connectDB();
    const category = await Category.findOne({ slug }).select('image').lean();
    return category ? (category as any).image : null;
  }

  /**
   * Invalidate tất cả cache liên quan đến Categories.
   */
  async invalidateCache(slug?: string): Promise<void> {
    await redis.del(CACHE_KEYS.CATEGORIES_ALL);
    if (slug) {
      await redis.del(CACHE_KEYS.CATEGORY_BY_SLUG(slug));
    }
  }
}
