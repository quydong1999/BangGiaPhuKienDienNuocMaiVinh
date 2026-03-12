import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import ProductList from './ProductList';
import GalleryProduct from './GalleryProduct';
import { categoryData } from '@/data/categories';
import { Category, Product } from '@/types/types';
export default async function TypePage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;

  if (!categoryData?.map(item => item.slug).includes(category)) {
    notFound();
  }

  const { title, data = [], filterField = null, visibleFields = [], layout } = categoryData?.find(item => item.slug === category) as Category;

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
            filterField={filterField}
            visibleFields={visibleFields}
          />
        ) : (
          <GalleryProduct data={data as any} />
        )}
      </div>
    </main>
  );
}
