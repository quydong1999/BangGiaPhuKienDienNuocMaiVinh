"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { getBlurPlaceholder } from '@/lib/image-blur';
import { ShoppingCart, Minus, Plus, Check } from 'lucide-react';
import type { Product } from '@/types/types';
import { useAppDispatch } from '@/store/hooks';
import { addToCart } from '@/store/cartSlice';
import { closeModal } from '@/store/modalSlice';
import { motion } from 'framer-motion';



interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  categoryImageUrl?: string;
}

const imgNotFoundUrl = "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?_=20210521171500";

/**
 * Parse price string like "12.500đ" or "1,200,000" to number.
 * Returns 0 if unable to parse.
 */
function parsePrice(priceStr: string): number {
  const cleaned = priceStr.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(/,/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

function formatPrice(value: number): string {
  return value.toLocaleString('vi-VN') + 'đ';
}

export function ProductPreviewModal({ isOpen, onClose, product, categoryImageUrl }: ProductPreviewModalProps) {
  const [quantityInput, setQuantityInput] = useState("1");
  const [isAdded, setIsAdded] = useState(false);
  const dispatch = useAppDispatch();
  const addToCartBtnRef = useRef<HTMLButtonElement>(null);

  if (!isOpen || !product) return null;

  const imageUrl = product.image?.secure_url || categoryImageUrl || imgNotFoundUrl;
  const unitPrice = parsePrice(product.priceSell);

  const parsedQuantity = parseFloat(quantityInput.replace(',', '.'));
  const isValid = !isNaN(parsedQuantity) && parsedQuantity >= 0.01;
  const quantity = isValid ? parsedQuantity : 1;
  const total = unitPrice * quantity;

  const handleAddToCart = () => {
    // Fire flying animation
    if (addToCartBtnRef.current) {
      const rect = addToCartBtnRef.current.getBoundingClientRect();
      window.dispatchEvent(new CustomEvent('fly-to-cart', {
        detail: {
          startX: rect.left + rect.width / 2,
          startY: rect.top,
        }
      }));
    }

    dispatch(addToCart({ product, quantity }));
    setIsAdded(true);
    setTimeout(() => {
      dispatch(closeModal());
      setQuantityInput("1");
      setIsAdded(false);
    }, 700);
  };



  const handleBlur = () => {
    // If empty or invalid, reset to the parsed value or 1
    if (isNaN(parsedQuantity) || parsedQuantity < 0.01) {
      setQuantityInput("1");
    } else {
      // Format back to string or leave as is
      setQuantityInput(String(Math.round(parsedQuantity * 100) / 100));
    }
  };

  return (
    <div
      className="fixed inset-0 z-30 bg-black/60 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white max-w-lg w-full overflow-hidden shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-1/2 min-h-[220px] bg-gray-50">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 480px, 100vw"
            className="object-contain"
            {...getBlurPlaceholder(imageUrl, 800, 600)}
          />
        </div>
        <div className="p-4 space-y-3">
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

          {/* Quantity + Total */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1">
              <span className="text-sm text-slate-600 mr-1">SL:</span>
              <button
                type="button"
                onClick={() => {
                  const currentVal = isNaN(parsedQuantity) ? 1 : parsedQuantity;
                  setQuantityInput(String(Math.max(0.01, currentVal - 1)));
                }}
                disabled={quantity <= 0.01}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Giảm số lượng"
              >
                <Minus size={14} />
              </button>
              <input
                type="text"
                value={quantityInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^[0-9]*[.,]?[0-9]*$/.test(val)) {
                    setQuantityInput(val);
                  }
                }}
                onBlur={handleBlur}
                className={`w-12 text-center text-sm font-semibold tabular-nums border rounded-md py-1 focus:outline-none focus:ring-1 ${
                  !isValid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  const currentVal = isNaN(parsedQuantity) ? 1 : parsedQuantity;
                  setQuantityInput(String(currentVal + 1));
                }}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Tăng số lượng"
              >
                <Plus size={14} />
              </button>
            </div>
            {unitPrice > 0 && (
              <span className="text-sm font-bold text-emerald-700">
                Tổng: {formatPrice(total)}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <motion.button
            ref={addToCartBtnRef}
            type="button"
            onClick={handleAddToCart}
            disabled={!isValid || isAdded}
            whileTap={{ scale: 0.96 }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              isAdded ? 'bg-emerald-500' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isAdded ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
              >
                <Check size={16} />
                <span>Đã thêm vào giỏ</span>
              </motion.div>
            ) : (
              <>
                <ShoppingCart size={16} />
                Thêm vào giỏ
              </>
            )}
          </motion.button>
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
