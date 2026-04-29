'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { getOptimizedImageUrl, getBlurPlaceholder } from '@/lib/image-blur';
import { Product } from '@/types/types';
import { useAppDispatch } from '@/store/hooks';
import { openModal } from '@/store/modalSlice';
import { FavoriteButton } from './FavoriteButton';
import { getRecentViewedProducts, RECENT_VIEWED_UPDATED_EVENT } from '@/lib/favorites';
import { formatVND } from '@/lib/utils';

const imgNotFoundUrl = "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?_=20210521171500";

export function RecentViewedProductsGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useAppDispatch();
  const clickTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchRecentViewed = async () => {
    try {
      const ids = getRecentViewedProducts();
      if (ids.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/products/by-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      const data = await res.json();
      if (data.success) {
        // Reorder the fetched products to match the order of IDs in localStorage
        const idToProduct = new Map(data.data.map((p: Product) => [p._id, p]));
        const orderedProducts = ids.map(id => idToProduct.get(id)).filter(Boolean) as Product[];
        setProducts(orderedProducts);
      }
    } catch (err) {
      console.error('Failed to fetch recent viewed products', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentViewed();

    const handleUpdate = () => {
      fetchRecentViewed();
    };

    window.addEventListener(RECENT_VIEWED_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(RECENT_VIEWED_UPDATED_EVENT, handleUpdate);
  }, []);

  const handleProductClick = (product: Product) => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      // Double click -> Edit
      dispatch(openModal({ type: 'productForm', props: { categoryId: product.categoryId, initialData: product } }));
    } else {
      clickTimer.current = setTimeout(() => {
        dispatch(openModal({ type: 'productPreview', props: { product } }));
        clickTimer.current = null;
      }, 300);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white border border-slate-200">
            <div className="aspect-[4/3] bg-slate-200" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 bg-white rounded-lg border border-slate-200">
        <p>Bạn chưa xem sản phẩm nào.</p>
        <p className="text-sm mt-2">Các sản phẩm bạn vừa xem sẽ hiển thị ở đây.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {products.map((item, index) => {
        const allPrices = item.specs?.flatMap(s => s.prices.map(p => p.price)) || [];
        const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
        const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;

        const isSingleVariant = item.specs?.length === 1 && item.specs[0].prices?.length === 1;
        const singleUnit = isSingleVariant ? item.specs[0].prices[0].unit : "";

        return (
          <div
            key={item._id}
            role="button"
            tabIndex={0}
            onClick={() => handleProductClick(item)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleProductClick(item); } }}
            className="group relative flex flex-col h-full bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all overflow-hidden active:scale-95 cursor-pointer"
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
              <FavoriteButton productId={item._id} />
            </div>
            <div className="p-2 sm:p-3 flex-1 flex flex-col text-left w-full">
              <div className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2">
                {item.name}
              </div>
              <div className="mt-auto pt-2 flex flex-col">
                <span className="text-xs sm:text-sm font-bold text-teal-600">
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
          </div>
        );
      })}
    </div>
  );
}
