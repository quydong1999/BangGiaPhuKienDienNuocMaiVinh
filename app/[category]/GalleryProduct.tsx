'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { getBlurPlaceholder } from '@/lib/image-blur';
import type { Product } from '@/types/types';
import { PendingProductSkeleton } from '@/components/PendingSkeletons';
import { useAdmin } from "@/hooks/useAdmin"
import { useAppDispatch } from '@/store/hooks';
import { openModal } from '@/store/modalSlice';

interface GalleryProductProps {
  data: Product[];
  categoryId: string;
}

const imgNotFoundUrl = "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?_=20210521171500";

export default function GalleryProduct({ data, categoryId }: GalleryProductProps) {
  const dispatch = useAppDispatch();
  const clickTimer = useRef<NodeJS.Timeout | null>(null);
  const searchParams = useSearchParams();
  const { isAdmin } = useAdmin();

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
      if (isAdmin) {
        dispatch(openModal({ type: 'productForm', props: { categoryId, initialData: product } }));
      } else {
        dispatch(openModal({ type: 'login' }));
      }
    } else {
      clickTimer.current = setTimeout(() => {
        dispatch(openModal({ type: 'productPreview', props: { product } }));
        clickTimer.current = null;
      }, 300);
    }
  };

  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {data.map((item, index) => (
          <button
            key={item._id}
            type="button"
            onClick={() => handleProductClick(item)}
            className={`group relative flex flex-col bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all overflow-hidden active:scale-95`}
          >
            <div className="relative w-full aspect-[4/3] bg-slate-100">
              <Image
                src={item.image?.secure_url ?? imgNotFoundUrl}
                alt={item.name}
                fill
                sizes="(min-width: 768px) 200px, 50vw"
                className="object-cover group-hover:scale-105 transition-transform"
                priority={index < 5}
                {...getBlurPlaceholder(item.image?.secure_url)}
              />
            </div>
            <div className="p-3 space-y-1 text-left">
              <div className="text-sm font-semibold text-slate-900 line-clamp-2">
                {item.name}
              </div>
              {item.spec && item.spec !== '-' && (
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-100 text-emerald-800`}
                  >
                    {item.spec}
                  </span>
                </div>
              )}
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Đơn vị: {item.unit}</span>
                <span className="text-sm font-bold text-slate-900">
                  {item.priceSell}
                </span>
              </div>
            </div>
          </button>
        ))}
        <PendingProductSkeleton categoryId={categoryId} layout="gallery" />
      </div>
    </div>
  );
}

