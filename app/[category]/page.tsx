"use client";

import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import ProductList from './ProductList';
import GalleryProduct from './GalleryProduct';
import { useCategory } from '@/hooks/useCategories';
import { useParams } from 'next/navigation';
import { FilterField, Product, VisibleField } from '@/types/types';
import { categoryData as localCategoryData } from '@/data/categories';

export default function TypePage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const { data: categoryData, isLoading, error } = useCategory(categorySlug);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500">Đang tải danh mục...</p>
      </main>
    );
  }

  if (error || !categoryData) {
    notFound();
  }

  const { title, filterField = null, visibleFields = [], layout } = categoryData;
  const data: Product[] = localCategoryData.find(item => item.slug === categorySlug)?.data || [];

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center h-14 px-4 max-w-3xl mx-auto w-full">
          <Link
            href="/"
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-semibold text-slate-900 ml-2">
            {title}
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 w-full max-w-3xl mx-auto p-4">
        {layout === 'table' ? (
          <ProductList
            data={data}
            filterField={filterField as FilterField}
            visibleFields={visibleFields as VisibleField[]}
          />
        ) : (
          <GalleryProduct data={data as Product[]} />
        )}
      </div>
    </main>
  );
}
