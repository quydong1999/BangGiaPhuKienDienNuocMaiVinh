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