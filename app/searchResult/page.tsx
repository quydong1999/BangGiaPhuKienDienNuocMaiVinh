'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import type { Product } from '@/types/types';
import { ProductFormModal } from '@/components/ProductFormModal';

interface SearchProduct extends Product {
  categoryName?: string;
  categoryShortTitle?: string;
  categorySlug?: string;
  layout?: "table" | "gallery";
  categoryId: string; // Ensure categoryId is available for linking
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-800">
          Kết quả cho: <span className="font-bold text-emerald-600">"{query}"</span>
        </h2>
        <span className="text-sm text-slate-500">
          Tìm thấy {results.length} sản phẩm
        </span>
      </div>

      {results.length > 0 ? (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
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
                      {/* <Link
                        href={`/${item.categorySlug}`}
                        className="text-slate-600 hover:text-slate-900 hover:underline"
                      >
                        {item.categoryShortTitle}
                      </Link> */}
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
    </div>
  );
}

export default function SearchResultPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center h-14 px-4 max-w-6xl mx-auto w-full">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900 ml-2">
            Kết Quả Tìm Kiếm
          </h1>
        </div>
      </header>

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

      <footer className="py-8 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} MAI VINH - Bảng giá phụ kiện điện nước
      </footer>
    </main>
  );
}
