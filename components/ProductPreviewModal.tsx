import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getBlurPlaceholder, getOptimizedImageUrl } from '@/lib/image-blur';
import { ShoppingCart, Check, Info, Plus, Minus } from 'lucide-react';
import type { Product } from '@/types/types';
import { useAppDispatch } from '@/store/hooks';
import { addToCart } from '@/store/cartSlice';
import { closeModal } from '@/store/modalSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { formatVND } from '@/lib/utils';

interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  categoryImageUrl?: string;
  initialSpec?: string;
  initialUnit?: string;
}

const imgNotFoundUrl = "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?_=20210521171500";

export function ProductPreviewModal({ isOpen, onClose, product, categoryImageUrl, initialSpec, initialUnit }: ProductPreviewModalProps) {
  const [selectedSpecIdx, setSelectedSpecIdx] = useState(0);
  const [selectedPriceIdx, setSelectedPriceIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [editingQty, setEditingQty] = useState<string | null>(null);
  const [addedItemKey, setAddedItemKey] = useState<string | null>(null);

  const dispatch = useAppDispatch();

  // Reset selection when product changes or modal is opened with specific variant
  useEffect(() => {
    if (product) {
      let specIdx = 0;
      let priceIdx = 0;

      if (initialSpec) {
        const foundSpecIdx = product.specs.findIndex(s => s.name === initialSpec);
        if (foundSpecIdx !== -1) {
          specIdx = foundSpecIdx;
          if (initialUnit) {
            const foundPriceIdx = product.specs[foundSpecIdx].prices.findIndex(p => p.unit === initialUnit);
            if (foundPriceIdx !== -1) {
              priceIdx = foundPriceIdx;
            }
          }
        }
      }

      setSelectedSpecIdx(specIdx);
      setSelectedPriceIdx(priceIdx);
      setQuantity(1);
      setEditingQty(null);
    }
  }, [product, initialSpec, initialUnit]);

  if (!isOpen || !product) return null;

  const imageUrl = product?.image?.secure_url || categoryImageUrl || imgNotFoundUrl;
  const currentSpec = product.specs[selectedSpecIdx];
  const currentPrice = currentSpec?.prices[selectedPriceIdx];

  const handleAddToCart = () => {
    if (!currentSpec || !currentPrice) return;

    const specName = currentSpec.name;
    const unit = currentPrice.unit;
    const price = currentPrice.price;
    const itemKey = `${specName}-${unit}`;

    dispatch(addToCart({
      product,
      specName,
      unit,
      price,
      quantity
    }));

    setAddedItemKey(itemKey);

    // Dispatch event for animation
    window.dispatchEvent(new CustomEvent('fly-to-cart', {
      detail: { startX: window.innerWidth / 2, startY: window.innerHeight / 2 }
    }));

    setTimeout(() => {
      setAddedItemKey(null);
      onClose();
    }, 800);
  };

  const handleSpecSelect = (idx: number) => {
    setSelectedSpecIdx(idx);
    setSelectedPriceIdx(0); // Reset unit when spec changes
  };

  const incrementQty = () => setQuantity(prev => prev + 1);
  const decrementQty = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const isJustAdded = addedItemKey === `${currentSpec?.name}-${currentPrice?.unit}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl rounded-2xl flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Image */}
        <div className="w-full md:w-1/2 h-72 md:h-auto relative bg-slate-50 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-slate-100">
          <div className="relative w-full aspect-square max-w-[400px]">
            <Image
              src={getOptimizedImageUrl(imageUrl, 800)}
              alt={product.name}
              fill
              className="object-contain"
              priority
              {...getBlurPlaceholder(imageUrl, 800, 600)}
            />
          </div>
        </div>

        {/* Right: Content Area (4 Rows) */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {/* Header, Title & Price (Static) */}
          <div className="p-6 pb-4 border-b border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">
              {product.name}
            </h2>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-600">
                  {currentPrice ? formatVND(currentPrice.price) : 'Liên hệ'}
                </span>
                {currentPrice && (
                  <span className="text-sm font-medium text-slate-400">/ {currentPrice.unit}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {product.specs.length > 0 ? (
              <>
                {/* Row 2: Specifications */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quy cách</span>
                  <div className="flex flex-wrap gap-2">
                    {product.specs.map((spec, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSpecSelect(idx)}
                        className={`px-2 py-1 rounded-sm text-sm transition-all border-2 ${selectedSpecIdx === idx
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                          : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                          }`}
                      >
                        {spec.name || 'Mặc định'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 3: Units (based on currentSpec) */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đơn vị tính</span>
                  <div className="flex flex-wrap gap-2">
                    {currentSpec?.prices.map((price, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedPriceIdx(idx)}
                        className={`px-2 py-1 rounded-sm text-sm transition-all border-2 ${selectedPriceIdx === idx
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                          : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                          }`}
                      >
                        {price.unit}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 italic">
                <Info size={40} className="mb-2 opacity-20" />
                <p>Sản phẩm chưa có thông tin cấu hình.</p>
              </div>
            )}
          </div>

          {/* Row 4: Quantity & Add to Cart (Split into 2 rows, centered label) */}
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500">Số lượng</span>
              <div className={`flex items-center bg-white border rounded-xl overflow-hidden h-12 shadow-sm w-[140px] transition-colors ${editingQty !== null && (isNaN(parseFloat(editingQty.replace(',', '.'))) || parseFloat(editingQty.replace(',', '.')) < 0.01)
                ? 'border-red-500 ring-1 ring-red-500'
                : 'border-slate-200'
                }`}>
                <button
                  onClick={decrementQty}
                  className="w-10 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus size={18} />
                </button>
                <input
                  type="text"
                  value={editingQty !== null ? editingQty : quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9]*[.,]?[0-9]*$/.test(val)) {
                      setEditingQty(val);
                    }
                  }}
                  onBlur={() => {
                    if (editingQty !== null) {
                      const parsed = parseFloat(editingQty.replace(',', '.'));
                      if (!isNaN(parsed) && parsed >= 0.01) {
                        setQuantity(Math.round(parsed * 100) / 100);
                      }
                      setEditingQty(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement;
                      const parsed = parseFloat(target.value.replace(',', '.'));
                      if (!isNaN(parsed) && parsed >= 0.01) {
                        setQuantity(Math.round(parsed * 100) / 100);
                        setEditingQty(null);
                      }
                    }
                  }}
                  className="flex-1 text-center font-bold text-slate-800 text-lg bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                />
                <button
                  onClick={incrementQty}
                  className="w-10 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!currentPrice || (editingQty !== null && (isNaN(parseFloat(editingQty.replace(',', '.'))) || parseFloat(editingQty.replace(',', '.')) < 0.01))}
              className={`w-full h-14 relative flex items-center justify-center gap-3 rounded-xl text-md font-black transition-all shadow-lg active:scale-[0.98] ${isJustAdded
                ? 'bg-emerald-500 text-white shadow-emerald-200'
                : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-slate-200'
                } disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed`}
            >
              <AnimatePresence mode="wait">
                {isJustAdded ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Check size={20} strokeWidth={3} /> <span>ĐÃ THÊM VÀO GIỎ</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="cart"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2"
                  >
                    <ShoppingCart size={20} /> <span>THÊM VÀO GIỎ HÀNG</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Close Button Mobile/Desktop */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-slate-400 hover:text-rose-500 hover:bg-white shadow-sm border border-slate-100 transition-all z-10"
        >
          ✕
        </button>
      </motion.div>
    </motion.div>
  );
}
