'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { getBlurPlaceholder, getOptimizedImageUrl } from '@/lib/image-blur';
import type { Product, FilterField } from '@/types/types';
import { PendingProductSkeleton } from '@/components/PendingSkeletons';
import { useAppDispatch } from '@/store/hooks';
import { openModal } from '@/store/modalSlice';

interface GalleryProductProps {
  data: Product[];
  categoryId: string;
  filterField?: FilterField;
}

const imgNotFoundUrl = "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?_=20210521171500";

import { formatVND } from '@/lib/utils';

export default function GalleryProduct({ data, categoryId, filterField }: GalleryProductProps) {
  const [selectedField, setSelectedField] = useState<string>('Tất cả');
  const dispatch = useAppDispatch();
  const clickTimer = useRef<NodeJS.Timeout | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const productId = searchParams.get('productId');
    if (productId && data.length > 0) {
      const product = data.find(p => p._id === productId);
      if (product) {
        dispatch(openModal({ type: 'productPreview', props: { product } }));
      }
    }
  }, [searchParams, data, dispatch]);

  const handleProductClick = (product: Product) => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      dispatch(openModal({ type: 'productForm', props: { categoryId, initialData: product } }));
    } else {
      clickTimer.current = setTimeout(() => {
        dispatch(openModal({ type: 'productPreview', props: { product } }));
        clickTimer.current = null;
      }, 300);
    }
  };

  // Extract unique product fields for filter
  const uniqueData = useMemo(() => {
    if (!filterField || !data) {
      return ['Tất cả'];
    }
    // Case 'spec': Lấy tất cả các spec name từ tất cả sản phẩm
    if (filterField === 'spec' as any) {
      const specs = new Set<string>();
      data.forEach(p => p.specs?.forEach(s => specs.add(s.name)));
      return ['Tất cả', ...Array.from(specs).sort((a, b) => a.localeCompare(b, 'vi'))];
    }
    const _data = new Set<string>(data.filter(Boolean).map(item => String((item as any)[filterField])));
    return ['Tất cả', ...Array.from(_data).sort((a, b) => a.localeCompare(b, 'vi'))];
  }, [data, filterField]);

  // Filter the original data
  const filteredData = useMemo(() => {
    if (!filterField || selectedField === 'Tất cả') return data;
    if (filterField === 'spec' as any) {
      return data.filter(item => item.specs?.some(s => s.name === selectedField));
    }
    const res = data.filter(item => String((item as any)[filterField]) === selectedField);
    // return data.filter(item => String((item as any)[filterField]) === selectedField);
    console.log(res)
    return res;
  }, [data, selectedField, filterField]);

  return (
    <div className="space-y-6">
      {/* Filter */}
      <nav aria-label="Bộ lọc sản phẩm" className="sticky top-[102px] sm:top-16 z-10 bg-light-grey pt-2 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {filterField && (
          <>
            <label
              htmlFor="product-filter"
              className="block text-sm font-medium text-slate-700 mb-1 mt-2"
            >
              Lọc theo tên sản phẩm
            </label>
            <div className="flex gap-2">
              <select
                id="product-filter"
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="block w-full border border-slate-300 shadow-sm py-3 px-4 text-base focus:ring-emerald-500 focus:border-emerald-500 transition-shadow bg-white"
              >
                {uniqueData.map(item => (
                  <option key={item} value={item ?? ""}>{item}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="mt-2 flex justify-between items-center text-sm">
          <span className="text-slate-500">
            Hiển thị {filteredData.length} sản phẩm
          </span>
        </div>
      </nav>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredData.map((item, index) => {
          const allPrices = item.specs?.flatMap(s => s.prices.map(p => p.price)) || [];
          const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
          const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;

          const isSingleVariant = item.specs?.length === 1 && item.specs[0].prices?.length === 1;
          const singleUnit = isSingleVariant ? item.specs[0].prices[0].unit : "";

          return (
            <button
              key={item._id}
              type="button"
              onClick={() => handleProductClick(item)}
              className={`group relative flex flex-col h-full bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all overflow-hidden active:scale-95`}
            >
              <div className="relative w-full aspect-[4/3] bg-slate-100 flex-shrink-0">
                <Image
                  src={getOptimizedImageUrl(item.images?.[0]?.secure_url ?? imgNotFoundUrl, 400)}
                  alt={item.name}
                  fill
                  sizes="(min-width: 768px) 200px, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform"
                  priority={index < 5}
                  quality={60}
                  {...getBlurPlaceholder(item.images?.[0]?.secure_url)}
                />
              </div>
              <div className="p-2 sm:p-3 flex-1 flex flex-col text-left w-full">
                <div className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2">
                  {item.name}
                </div>
                <div className="mt-auto pt-2 flex flex-col">
                  <span className="text-xs sm:text-sm font-bold text-emerald-600">
                    {minPrice === maxPrice ? (
                      <>
                        {formatVND(minPrice)}
                        {singleUnit && <span className="text-sm font-medium text-slate-400"> / {singleUnit}</span>}
                      </>
                    ) : (
                      `${formatVND(minPrice)} - ${formatVND(maxPrice)}`
                    )}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
        <PendingProductSkeleton categoryId={categoryId} layout="gallery" />
      </div>
    </div>
  );
}

