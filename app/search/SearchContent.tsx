'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import Image from 'next/image';
import { HomeHeader } from '@/components/HomeHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import type { Product } from '@/types/types';
import { formatVND } from '@/lib/utils';
import { getBlurPlaceholder, getOptimizedImageUrl } from '@/lib/image-blur';

interface SearchProduct extends Product {
  categoryName?: string;
  categoryShortTitle?: string;
  categorySlug?: string;
  layout?: "table" | "gallery";
  categoryId: string;
}

const imgNotFoundUrl = "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?_=20210521171500";

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          // Không flatten — giữ nguyên từng product (group by name)
          setResults(data.data as SearchProduct[]);
        }
      } catch (error) {
        console.error("Search fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const handleProductClick = (item: SearchProduct) => {
    // Redirect to category page with productId to auto-open ProductPreviewModal
    if (item.categorySlug) {
      router.push(`/${item.categorySlug}?productId=${item._id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p>Đang tìm kiếm sản phẩm...</p>
      </div>
    );
  }

  return (
    <section aria-label="Kết quả tìm kiếm" className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-slate-800">
          Kết quả cho: <span className="font-bold text-emerald-600">"{query}"</span>
        </h2>
        <span className="text-sm text-slate-500">
          Tìm thấy {results.length} sản phẩm
        </span>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((item, index) => {
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
                className="group relative flex flex-col h-full bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all overflow-hidden active:scale-95"
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
                  {item.categoryShortTitle && (
                    <span className="mt-1 text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 w-fit">
                      {item.categoryShortTitle}
                    </span>
                  )}
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
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-lg">
          <Search className="mx-auto text-slate-200 mb-4" size={60} />
          <p className="text-slate-500 font-medium">Không tìm thấy sản phẩm nào phù hợp.</p>
        </div>
      )}
    </section>
  );
}

export default function SearchContent() {
  return (
    <main id="main-content" className="min-h-screen bg-light-grey flex flex-col">
      {/* Header & Breadcrumb */}
      <HomeHeader compact />
      <div className="w-full max-w-6xl mx-auto px-4 mt-1">
        <Breadcrumbs 
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Kết quả tìm kiếm' }
          ]} 
        />
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-6">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p>Đang tải...</p>
          </div>
        }>
          <SearchResults />
        </Suspense>
      </div>
    </main>
  );
}
