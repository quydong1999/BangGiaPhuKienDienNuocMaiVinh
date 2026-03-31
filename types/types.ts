export type VisibleField =
  | 'name'
  | 'spec'
  | 'unit'
  | 'priceSell';

export type FilterField =
  | 'name'
  | 'spec';

export type CloudinaryImage = {
  public_id?: string;
  url?: string;
  secure_url?: string;
  width?: number;
  height?: number;
  format?: string;
};

export type Category = {
  _id: string,
  slug: string;
  title: string;
  shortTitle: string;
  image?: CloudinaryImage;
  data?: Product[];
  filterField?: FilterField | null;
  visibleFields?: VisibleField[];
  layout: "table" | "gallery";
}

export type ProductPrice = {
  unit: string;
  price: number;
};

export type ProductSpec = {
  name: string;
  prices: ProductPrice[];
};

export type Product = {
  _id: string,
  name: string;
  specs: ProductSpec[];
  images?: CloudinaryImage[];
  categoryId?: string;
};

export interface FlattenedProduct extends Omit<Product, 'specs'> {
  _id_variant: string;
  spec: string;
  unit: string;
  priceSell: number;
}