export type Product = {
  stt?: string;
  name: string;
  spec?: string;
  unit?: string;
  priceTax?: string;
  priceDiscount?: string;
  priceSell: string;
  src?: string;
  alt?: string;
};

export const CATEGORY_SLUGS = [
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

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];