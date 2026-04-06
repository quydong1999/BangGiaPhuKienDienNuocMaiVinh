import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Product } from "@/types/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatVND(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + " đ";
}

export function flattenProducts(products: Product[]) {
  return (products || []).flatMap((product) =>
    (product.specs || []).flatMap((spec) =>
      (spec.prices || []).map((price) => ({
        ...product,
        spec: spec.name,
        unit: price.unit,
        priceSell: price.price, // Map to old field name for easier table rendering
        basePrice: price.basePrice || 0,
        _id_variant: `${product._id}-${spec.name}-${price.unit}`,
      }))
    )
  );
}
