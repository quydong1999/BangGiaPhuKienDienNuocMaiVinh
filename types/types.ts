export type VisibleField =
  | '_id'
  | 'name'
  | 'spec'
  | 'unit'
  | 'priceTax'
  | 'priceDiscount'
  | 'priceSell';

export type FilterField =
  | '_id'
  | 'name'
  | 'spec';

  export type CloudinaryImage = {
    public_id: string;
    url: string;
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

export type Product = {
  _id: string,
  name: string;
  spec?: string;
  unit?: string;
  priceTax?: string;
  priceDiscount?: string;
  priceSell: string;
  image?: CloudinaryImage;
  alt?: string;
};