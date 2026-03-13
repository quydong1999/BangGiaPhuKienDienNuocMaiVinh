'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/types/types';
import { PendingProductSkeleton } from '@/components/PendingSkeletons';

interface GalleryProductProps {
  data: Product[];
  categoryId: string;
}

const imgNotFoundUrl = "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?_=20210521171500";

export default function GalleryProduct({ data, categoryId }: GalleryProductProps) {
  const [selected, setSelected] = useState<Product | null>(null);

  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {data.map((item) => (
          <button
            key={item._id}
            type="button"
            onClick={() => setSelected(item)}
            className={`group relative flex flex-col bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all overflow-hidden`}
          >
            <div className="relative w-full aspect-[4/3] bg-slate-100">
              <Image
                src={item.image?.secure_url ?? imgNotFoundUrl}
                alt={""}
                fill
                sizes="(min-width: 768px) 200px, 50vw"
                className="object-cover group-hover:scale-105 transition-transform"
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

      {/* Modal preview */}
      {selected && (
        <div
          className="fixed inset-0 z-30 bg-black/60 flex items-center justify-center px-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative bg-white max-w-lg w-full overflow-hidden shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-1/2 min-h-[220px] bg-black">
              <Image
                src={selected.image?.secure_url ?? imgNotFoundUrl}
                alt={""}
                fill
                sizes="(min-width: 768px) 480px, 100vw"
                className="object-cover"
              />
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-900">
                  {selected.name}
                </h2>
                <span className="text-sm font-bold text-slate-900">
                  {selected.priceSell}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                {selected.spec && selected.spec !== '-' && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium bg-emerald-100 text-emerald-800`}
                  >
                    {selected.spec}
                  </span>
                )}
                <span>Đơn vị: {selected.unit}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/60 text-white text-sm hover:bg-black/80 transition-colors"
              aria-label="Đóng xem ảnh"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

