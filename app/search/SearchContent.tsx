'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { HomeHeader } from '@/components/HomeHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import type { Product } from '@/types/types';

interface SearchProduct extends Product {
  categoryName?: string;
  categoryShortTitle?: string;
  categorySlug?: string;
  layout?: "table" | "gallery";
  categoryId: string;
}

function SearchResults() {
  const searchParams = useSearchParams();
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
          setResults(data.data);
        }
      } catch (error) {
        console.error("Search fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

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
      <h2 className="text-lg font-medium text-slate-800">
        Kết quả cho: <span className="font-bold text-emerald-600">"{query}"</span>
      </h2>
      <span className="text-sm text-slate-500">
        Tìm thấy {results.length} sản phẩm
      </span>

      {results.length > 0 ? (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <caption className="sr-only">Bảng kết quả tìm kiếm sản phẩm</caption>
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="px-4 py-3">Tên sản phẩm</th>
                  <th className="px-4 py-3">Quy cách</th>
                  <th className="px-4 py-3">Danh mục</th>
                  <th className="px-4 py-3">Đơn vị</th>
                  <th className="px-4 py-3 text-right">Giá bán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {results.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link
                        href={`/${item.categorySlug}?productId=${item._id}`}
                        className="hover:underline transition-colors"
                      >
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-1 rounded-md bg-emerald-100 text-emerald-800">
                        {item.spec}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-4 py-3 text-slate-600">
                        {item.categoryShortTitle}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.unit}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {item.priceSell}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
  const router = useRouter();

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
