/**
 * Service Layer - Shared Interfaces
 * Chuẩn hóa kiểu dữ liệu trả về cho toàn bộ Service, giúp dễ dàng mở rộng
 * và sẵn sàng chuyển đổi sang NestJS bằng cách thêm Decorators.
 */

// ─── Generic Service Response ────────────────────────────────────────────────

export interface IServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface IListResponse<T = unknown> extends IServiceResponse<T[]> {
  count: number;
  source: 'cache' | 'database';
}

// ─── Product Interfaces ─────────────────────────────────────────────────────

export interface ICloudinaryImage {
  public_id?: string;
  url?: string;
  secure_url?: string;
}

export interface IProductPrice {
  unit: string;
  price: number;
  basePrice: number;
}

export interface IProductSpec {
  name: string;
  prices: IProductPrice[];
}

export interface IProduct {
  _id: string;
  name: string;
  specs: IProductSpec[];
  images?: ICloudinaryImage[];
  categoryId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProductCreateInput {
  name: string;
  specs: IProductSpec[];
  categoryId: string;
  images?: ICloudinaryImage[] | null;
}

export interface IProductUpdateInput {
  name?: string;
  specs?: IProductSpec[];
  categoryId?: string;
  images?: ICloudinaryImage[] | null;
}

export interface ISearchResult extends IProduct {
  categoryName?: string;
  categoryShortTitle?: string;
  categorySlug?: string;
  layout?: string;
  score?: number;
}

// ─── Category Interfaces ────────────────────────────────────────────────────

export type VisibleField = 'name' | 'spec' | 'unit' | 'priceSell';
export type FilterField = 'name' | 'spec';
export type LayoutType = 'table' | 'gallery';

export interface ICategory {
  _id: string;
  slug: string;
  title: string;
  shortTitle?: string;
  image?: ICloudinaryImage;
  layout: LayoutType;
  visibleFields?: VisibleField[];
  filterField?: FilterField | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICategoryCreateInput {
  slug: string;
  title: string;
  shortTitle?: string;
  layout?: string;
  filterField?: string;
  visibleFields?: string[];
  image?: ICloudinaryImage | null;
}

export interface ICategoryUpdateInput {
  slug?: string;
  title?: string;
  shortTitle?: string;
  layout?: string;
  filterField?: string;
  visibleFields?: string[];
  image?: ICloudinaryImage | null;
}

// ─── Bulk Import Interfaces ─────────────────────────────────────────────────

export type BulkImportAction = 'new_product' | 'new_spec' | 'new_price' | 'update_price' | 'unchanged';

export interface IBulkImportRow {
  name: string;
  spec: string;
  unit: string;
  price: number;
  basePrice?: number;
  action: BulkImportAction;
}

export interface IBulkImportResult {
  productsCreated: number;
  specsAdded: number;
  pricesAdded: number;
  pricesUpdated: number;
  totalProcessed: number;
}
