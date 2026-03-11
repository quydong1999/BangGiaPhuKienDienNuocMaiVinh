export type Product = {
  stt: string;
  name: string;
  spec: string;
  unit: string;
  priceTax: string;
  priceDiscount: string;
  priceSell: string;
};

export type ProductImage = {
  src: string;
  alt: string;
};

export type GalleryProduct = Product & {
  image: ProductImage;
};

export const TYPE_SLUGS = [
  'phu-kien-ong-nuoc-dat-hoa-loai-day',
  'phu-kien-ong-nuoc-dat-hoa-loai-mong',
  'ong-nuoc-dat-hoa',
  'ong-nuoc-van-phuoc',
  'ong-nhua-deo',
  'luoi',
  'day-bo',
  'day-dien-doi-vinh-thinh',
  'day-dien-nhom-don-vinh-thinh'
] as const;

export type TypeSlug = (typeof TYPE_SLUGS)[number];