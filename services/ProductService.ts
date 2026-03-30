/**
 * ProductService
 *
 * Lớp Service xử lý toàn bộ logic nghiệp vụ cho Product.
 * Sử dụng Static Methods — sẵn sàng chuyển sang NestJS bằng cách thêm @Injectable().
 *
 * Pattern:
 *   - API Route gọi Service → Service xử lý DB + Cache → trả về dữ liệu thuần (plain object).
 *   - API Route chỉ lo nhận Request và trả Response.
 */

import { connectDB } from '@/lib/mongodb';
import { redis, CACHE_KEYS, DEFAULT_TTL } from '@/lib/redis';
import Product from '@/models/Product';
import Category from '@/models/Category';
import type {
  IProduct,
  IProductCreateInput,
  IProductUpdateInput,
  ISearchResult,
  IServiceResponse,
  IListResponse,
} from '@/types/service.types';

export class ProductService {
  private static instance: ProductService;

  private constructor() {}

  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  // ─── GET ALL / BY CATEGORY ───────────────────────────────────────────────

  /**
   * Lấy danh sách Products, hỗ trợ lọc theo categoryId.
   * Ưu tiên lấy từ Redis Cache, nếu miss thì query MongoDB.
   */
  async findAll(categoryId?: string): Promise<IListResponse<IProduct>> {
    const cacheKey = categoryId
      ? CACHE_KEYS.PRODUCTS_BY_CATEGORY(categoryId)
      : CACHE_KEYS.PRODUCTS_ALL;

    // 1. Cache check
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = cached as IProduct[];
      return { success: true, count: data.length, data, source: 'cache' };
    }

    // 2. DB query
    await connectDB();
    const filter: Record<string, string> = {};
    if (categoryId) filter.categoryId = categoryId;

    const products = await Product.find(filter).sort({ name: 1, spec: 1 }).lean();

    // 3. Cache store
    await redis.set(cacheKey, products, { ex: DEFAULT_TTL });

    return {
      success: true,
      count: products.length,
      data: products as IProduct[],
      source: 'database',
    };
  }

  // ─── SEARCH (Atlas Search + Redis Cache) ─────────────────────────────────

  /**
   * Tìm kiếm sản phẩm bằng MongoDB Atlas Search.
   * Kết quả được cache trong Redis với TTL 30 phút.
   */
  async search(query: string): Promise<IListResponse<ISearchResult>> {
    if (!query || query.length < 2) {
      return { success: true, count: 0, data: [], source: 'cache' };
    }

    // 1. Cache check
    const cacheKey = CACHE_KEYS.SEARCH_QUERY(query);
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = cached as ISearchResult[];
      return { success: true, count: data.length, data, source: 'cache' };
    }

    // 2. Atlas Search aggregation
    await connectDB();
    const results = await Product.aggregate<ISearchResult>([
      {
        $search: {
          index: 'product-search',
          compound: {
            should: [
              {
                text: {
                  query,
                  path: 'name',
                  fuzzy: { maxEdits: 1 },
                  score: { boost: { value: 3 } },
                },
              },
              {
                text: {
                  query,
                  path: ['specs.name', 'name.raw'],
                  fuzzy: { maxEdits: 1 },
                },
              },
            ],
          },
        },
      },
      { $limit: 30 },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      {
        $unwind: {
          path: '$categoryInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          specs: 1,
          image: 1,
          categoryId: 1,
          categoryName: '$categoryInfo.title',
          categoryShortTitle: '$categoryInfo.shortTitle',
          categorySlug: '$categoryInfo.slug',
          layout: '$categoryInfo.layout',
          score: { $meta: 'searchScore' },
        },
      },
    ]);

    // 3. Cache store (30 minutes for search)
    await redis.set(cacheKey, results, { ex: 1800 });

    return {
      success: true,
      count: results.length,
      data: results,
      source: 'database',
    };
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────

  /**
   * Tạo mới Product và invalidate cache.
   */
  async create(input: IProductCreateInput): Promise<IServiceResponse<IProduct>> {
    const mongoose = await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (!input.name || !input.specs || input.specs.length === 0 || !input.categoryId) {
        await session.abortTransaction();
        return {
          success: false,
          message: 'Thiếu thông tin bắt buộc (tên, cấu hình hoặc danh mục)',
        };
      }

      // Validation: Mỗi spec phải có ít nhất 1 price
      for (const spec of input.specs) {
        if (!spec.name || !spec.prices || spec.prices.length === 0) {
          await session.abortTransaction();
          return {
            success: false,
            message: `Cấu hình "${spec.name || 'không tên'}" phải có ít nhất một mức giá`,
          };
        }
      }

      // Check if category exists
      const categoryExists = await Category.findById(input.categoryId).session(session);
      if (!categoryExists) {
        await session.abortTransaction();
        return { success: false, message: 'Danh mục không tồn tại' };
      }

      const newProduct = await Product.create([input], { session });
      const createdProduct = newProduct[0];

      await session.commitTransaction();

      // Invalidate cache
      await this.invalidateCache(input.categoryId);

      return {
        success: true,
        message: 'Tạo sản phẩm thành công',
        data: createdProduct.toObject() as unknown as IProduct,
      };
    } catch (error: any) {
      await session.abortTransaction();
      return { success: false, message: 'Lỗi server khi tạo sản phẩm', error: error.message };
    } finally {
      await session.endSession();
    }
  }

  // ─── UPDATE (findOneAndUpdate, returnDocument: 'after') ──────────────────

  /**
   * Cập nhật Product bằng findOneAndUpdate với option returnDocument: 'after'.
   * Trả về document đã được cập nhật.
   */
  async update(
    id: string,
    input: IProductUpdateInput
  ): Promise<IServiceResponse<IProduct>> {
    const mongoose = await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existingProduct = await Product.findById(id).session(session);
      if (!existingProduct) {
        await session.abortTransaction();
        return { success: false, message: 'Không tìm thấy sản phẩm' };
      }

      // Check if target category exists (if changing)
      if (input.categoryId && input.categoryId !== existingProduct.categoryId.toString()) {
        const categoryExists = await Category.findById(input.categoryId).session(session);
        if (!categoryExists) {
          await session.abortTransaction();
          return { success: false, message: 'Danh mục đích không tồn tại' };
        }
      }

      // Validation specs nếu có cập nhật
      if (input.specs) {
        if (input.specs.length === 0) {
          await session.abortTransaction();
          return { success: false, message: 'Danh sách cấu hình không được để trống' };
        }
        for (const spec of input.specs) {
          if (!spec.name || !spec.prices || spec.prices.length === 0) {
            await session.abortTransaction();
            return {
              success: false,
              message: `Cấu hình "${spec.name || 'không tên'}" phải có nhất một mức giá`,
            };
          }
        }
      }

      const updatedProduct = await Product.findOneAndUpdate(
        { _id: id },
        { $set: input },
        { returnDocument: 'after', session }
      ).lean();

      if (!updatedProduct) {
        await session.abortTransaction();
        return { success: false, message: 'Cập nhật sản phẩm thất bại' };
      }

      await session.commitTransaction();

      // Invalidate cache cho cả category cũ và mới (nếu thay đổi)
      const newCategoryId = input.categoryId || existingProduct.categoryId.toString();
      await this.invalidateCache(newCategoryId);

      if (
        input.categoryId &&
        existingProduct.categoryId.toString() !== input.categoryId
      ) {
        await this.invalidateCache(existingProduct.categoryId.toString());
      }

      return {
        success: true,
        message: 'Cập nhật sản phẩm thành công',
        data: updatedProduct as unknown as IProduct,
      };
    } catch (error: any) {
      await session.abortTransaction();
      return { success: false, message: 'Lỗi server khi cập nhật sản phẩm', error: error.message };
    } finally {
      await session.endSession();
    }
  }

  // ─── DELETE ──────────────────────────────────────────────────────────────

  /**
   * Xóa Product theo ID và invalidate cache.
   */
  async delete(id: string): Promise<IServiceResponse<null>> {
    await connectDB();

    const product = await Product.findById(id);
    if (!product) {
      return { success: false, message: 'Không tìm thấy sản phẩm' };
    }

    await Product.findByIdAndDelete(id);

    // Invalidate cache
    await this.invalidateCache(product.categoryId.toString());

    return { success: true, message: 'Xóa sản phẩm thành công', data: null };
  }

  // ─── CACHE INVALIDATION (Private Helper) ─────────────────────────────────

  /**
   * Xóa tất cả Redis cache liên quan đến Products.
   * Bao gồm: products by category, all products.
   */
  async invalidateCache(categoryId?: string): Promise<void> {
    const keysToDelete = [CACHE_KEYS.PRODUCTS_ALL];
    if (categoryId) {
      keysToDelete.push(CACHE_KEYS.PRODUCTS_BY_CATEGORY(categoryId));
    }
    await Promise.all(keysToDelete.map((key) => redis.del(key)));
  }

  // ─── REVALIDATION HELPER ─────────────────────────────────────────────────

  /**
   * Lấy slug của Category theo ID — dùng để revalidatePath trong API Route.
   * (Revalidation là concern của Route Handler, không phải Service.)
   */
  async getCategorySlugById(categoryId: string): Promise<string | null> {
    await connectDB();
    const category = await Category.findById(categoryId).select('slug').lean();
    return category ? (category as { slug: string }).slug : null;
  }
}
