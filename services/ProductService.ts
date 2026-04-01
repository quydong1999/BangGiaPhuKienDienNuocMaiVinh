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
  IBulkImportRow,
  IBulkImportResult,
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
      // Đảm bảo dữ liệu từ cache cũng được sort A-Z đề phòng cache cũ
      data.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      return { success: true, count: data.length, data, source: 'cache' };
    }

    // 2. DB query
    await connectDB();
    const filter: Record<string, string> = {};
    if (categoryId) filter.categoryId = categoryId;

    const products = await Product.find(filter)
      .collation({ locale: 'vi', strength: 2 })
      .sort({ name: 1, 'specs.name': 1 })
      .lean();

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
          images: 1,
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

  // ─── BULK IMPORT ────────────────────────────────────────────────────────

  /**
   * Nhập hàng loạt từ CSV.
   * Toàn bộ xử lý trong một Transaction duy nhất.
   * Tối ưu: fetch all products 1 lần, gom nhóm operations trước khi ghi.
   */
  async bulkImport(
    categoryId: string,
    rows: IBulkImportRow[]
  ): Promise<IServiceResponse<IBulkImportResult>> {
    const mongoose = await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();

    const normalize = (s: string) => s.trim().toLowerCase();

    try {
      // 1. Verify category
      const categoryExists = await Category.findById(categoryId).session(session);
      if (!categoryExists) {
        await session.abortTransaction();
        return { success: false, message: 'Danh mục không tồn tại' };
      }

      // 2. Fetch ALL products of this category — 1 query (tránh N+1)
      const existingProducts = await Product.find({ categoryId }).session(session);

      // 3. Build lookup: normalizedName → Product document
      const productLookup = new Map<string, typeof existingProducts[0]>();
      for (const p of existingProducts) {
        productLookup.set(normalize(p.name), p);
      }

      const result: IBulkImportResult = {
        productsCreated: 0,
        specsAdded: 0,
        pricesAdded: 0,
        pricesUpdated: 0,
        totalProcessed: rows.length,
      };

      // 4. Gom nhóm new_product rows → Map<name, specs>
      const newProductsMap = new Map<string, { originalName: string; specs: Map<string, { originalSpec: string; prices: { unit: string; price: number }[] }> }>();

      for (const row of rows) {
        if (row.action === 'new_product') {
          const key = normalize(row.name);
          if (!newProductsMap.has(key)) {
            newProductsMap.set(key, { originalName: row.name, specs: new Map() });
          }
          const entry = newProductsMap.get(key)!;
          const specKey = normalize(row.spec);
          if (!entry.specs.has(specKey)) {
            entry.specs.set(specKey, { originalSpec: row.spec, prices: [] });
          }
          entry.specs.get(specKey)!.prices.push({ unit: row.unit, price: row.price });
        }
      }

      // 5. Batch create new products
      if (newProductsMap.size > 0) {
        const newProducts = Array.from(newProductsMap.values()).map(entry => ({
          name: entry.originalName,
          categoryId,
          specs: Array.from(entry.specs.values()).map(spec => ({
            name: spec.originalSpec,
            prices: spec.prices,
          })),
        }));
        await Product.create(newProducts, { session });
        result.productsCreated = newProducts.length;
      }

      // 6. Gom nhóm rows cần update existing products
      // Map<normalizedProductName, { new_specs, new_prices, update_prices }>
      type UpdateEntry = {
        product: typeof existingProducts[0];
        newSpecs: Map<string, { originalSpec: string; prices: { unit: string; price: number }[] }>;
        newPrices: { specName: string; unit: string; price: number }[];
        updatePrices: { specName: string; unit: string; price: number }[];
      };
      const updatesMap = new Map<string, UpdateEntry>();

      const getOrCreateUpdate = (productName: string): UpdateEntry | null => {
        const key = normalize(productName);
        if (updatesMap.has(key)) return updatesMap.get(key)!;
        const product = productLookup.get(key);
        if (!product) return null;
        const entry: UpdateEntry = { product, newSpecs: new Map(), newPrices: [], updatePrices: [] };
        updatesMap.set(key, entry);
        return entry;
      };

      for (const row of rows) {
        if (row.action === 'new_spec') {
          const entry = getOrCreateUpdate(row.name);
          if (!entry) continue;
          const specKey = normalize(row.spec);
          if (!entry.newSpecs.has(specKey)) {
            entry.newSpecs.set(specKey, { originalSpec: row.spec, prices: [] });
          }
          entry.newSpecs.get(specKey)!.prices.push({ unit: row.unit, price: row.price });
        } else if (row.action === 'new_price') {
          const entry = getOrCreateUpdate(row.name);
          if (!entry) continue;
          entry.newPrices.push({ specName: row.spec, unit: row.unit, price: row.price });
        } else if (row.action === 'update_price') {
          const entry = getOrCreateUpdate(row.name);
          if (!entry) continue;
          entry.updatePrices.push({ specName: row.spec, unit: row.unit, price: row.price });
        }
      }

      // 7. Execute updates per product (batch within each product)
      for (const [, entry] of updatesMap) {
        const product = entry.product;
        let modified = false;

        // 7a. Add new specs
        for (const [, specData] of entry.newSpecs) {
          product.specs.push({
            name: specData.originalSpec,
            prices: specData.prices,
          });
          result.specsAdded++;
          modified = true;
        }

        // 7b. Add new prices to existing specs
        for (const np of entry.newPrices) {
          const spec = product.specs.find(
            (s: any) => normalize(s.name) === normalize(np.specName)
          );
          if (spec) {
            spec.prices.push({ unit: np.unit, price: np.price });
            result.pricesAdded++;
            modified = true;
          }
        }

        // 7c. Update existing prices
        for (const up of entry.updatePrices) {
          const spec = product.specs.find(
            (s: any) => normalize(s.name) === normalize(up.specName)
          );
          if (spec) {
            const price = spec.prices.find(
              (p: any) => normalize(p.unit) === normalize(up.unit)
            );
            if (price) {
              price.price = up.price;
              result.pricesUpdated++;
              modified = true;
            }
          }
        }

        if (modified) {
          await product.save({ session });
        }
      }

      await session.commitTransaction();

      // Invalidate cache
      await this.invalidateCache(categoryId);

      return {
        success: true,
        message: 'Nhập hàng loạt thành công',
        data: result,
      };
    } catch (error: any) {
      await session.abortTransaction();
      console.error('Lỗi bulk import:', error);
      return { success: false, message: 'Lỗi server khi nhập hàng loạt', error: error.message };
    } finally {
      await session.endSession();
    }
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
