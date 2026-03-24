'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { getBlurPlaceholder } from '@/lib/image-blur';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCartItems, removeFromCart, updateQuantity, clearCart } from '@/store/cartSlice';
import Swal from 'sweetalert2';

const imgNotFoundUrl = "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?_=20210521171500";

function parsePrice(priceStr: string): number {
  const cleaned = priceStr.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(/,/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

function formatPrice(value: number): string {
  return value.toLocaleString('vi-VN') + 'đ';
}

export default function CartContent() {
  const items = useAppSelector(selectCartItems);
  const dispatch = useAppDispatch();

  // Local state to track the raw text while user is typing
  const [editingQty, setEditingQty] = useState<Record<string, string>>({});

  const getDisplayQty = (productId: string, quantity: number) =>
    editingQty[productId] ?? String(quantity);

  const commitQuantity = (productId: string, raw: string, fallback: number) => {
    const parsed = parseFloat(raw.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0.01) {
      const rounded = Math.round(parsed * 100) / 100; // max 2 decimals
      dispatch(updateQuantity({ productId, quantity: rounded }));
    }
    // Always clear local editing state — will fall back to Redux value
    setEditingQty(prev => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const hasInvalidQty = Object.values(editingQty).some(val => {
    const parsed = parseFloat(val.replace(',', '.'));
    return isNaN(parsed) || parsed < 0.01;
  });

  const grandTotal = items.reduce((sum, item) => {
    return sum + parsePrice(item.product.priceSell) * item.quantity;
  }, 0);

  const handleCheckout = () => {
    Swal.fire({
      icon: 'success',
      title: 'Thanh toán thành công!',
      text: 'Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được ghi nhận.',
      confirmButtonColor: '#059669',
      confirmButtonText: 'OK',
    }).then(() => {
      dispatch(clearCart());
    });
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <ShoppingBag size={32} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Giỏ hàng trống</h2>
        <p className="text-sm text-slate-500 mb-6">Bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          Tiếp tục mua hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cart Items */}
      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {items.map((item) => {
          const imageUrl = item.product.image?.secure_url || imgNotFoundUrl;
          const unitPrice = parsePrice(item.product.priceSell);
          const lineTotal = unitPrice * item.quantity;

          return (
            <div
              key={item.product._id}
              className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4"
            >
              {/* Image */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-slate-50 rounded overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={item.product.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                  {...getBlurPlaceholder(imageUrl)}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
                    {item.product.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => dispatch(removeFromCart(item.product._id))}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label={`Xóa ${item.product.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {item.product.spec && item.product.spec !== '-' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-100 text-emerald-800">
                    {item.product.spec}
                  </span>
                )}

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => commitQuantity(item.product._id, String(item.quantity - 1), item.quantity)}
                      disabled={item.quantity <= 0.01}
                      className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Giảm số lượng"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="text"
                      value={getDisplayQty(item.product._id, item.quantity)}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[0-9]*[.,]?[0-9]*$/.test(val)) {
                          setEditingQty(prev => ({ ...prev, [item.product._id]: val }));
                        }
                      }}
                      onBlur={(e) => commitQuantity(item.product._id, e.target.value, item.quantity)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          commitQuantity(item.product._id, (e.target as HTMLInputElement).value, item.quantity);
                        }
                      }}
                      className={`w-12 text-center text-sm font-semibold tabular-nums border rounded-md py-1 focus:outline-none focus:ring-1 ${editingQty[item.product._id] !== undefined && (isNaN(parseFloat(editingQty[item.product._id].replace(',', '.'))) || parseFloat(editingQty[item.product._id].replace(',', '.')) < 0.01)
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => commitQuantity(item.product._id, String(item.quantity + 1), item.quantity)}
                      className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
                      aria-label="Tăng số lượng"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">{item.product.priceSell} × {item.quantity}</span>
                    {unitPrice > 0 && (
                      <div className="text-sm font-bold text-slate-900">{formatPrice(lineTotal)}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary & Checkout */}
      <div className="bg-white border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Tổng ({items.length} sản phẩm)</span>
          {grandTotal > 0 && (
            <span className="text-lg font-bold text-emerald-700">{formatPrice(grandTotal)}</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={hasInvalidQty}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
        >
          <ShoppingBag size={18} />
          Thanh toán
        </button>
      </div>
    </div>
  );
}
