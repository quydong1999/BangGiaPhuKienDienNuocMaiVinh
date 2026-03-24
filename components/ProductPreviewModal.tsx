"use client";

import Image from 'next/image';
import { getBlurPlaceholder } from '@/lib/image-blur';
import type { Product } from '@/types/types';

interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
}

const imgNotFoundUrl = "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?_=20210521171500";

export function ProductPreviewModal({ isOpen, onClose, product }: ProductPreviewModalProps) {
  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-30 bg-black/60 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white max-w-lg w-full overflow-hidden shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-1/2 min-h-[220px] bg-black">
          <Image
            src={product.image?.secure_url ?? imgNotFoundUrl}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 480px, 100vw"
            className="object-cover"
            {...getBlurPlaceholder(product.image?.secure_url, 800, 600)}
          />
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              {product.name}
            </h2>
            <span className="text-sm font-bold text-slate-900">
              {product.priceSell}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            {product.spec && product.spec !== '-' && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium bg-emerald-100 text-emerald-800`}
              >
                {product.spec}
              </span>
            )}
            <span>Đơn vị: {product.unit}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/60 text-white text-sm hover:bg-black/80 transition-colors"
          aria-label="Đóng xem ảnh"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
