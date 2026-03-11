import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { TYPE_SLUGS, type TypeSlug } from '@/types/types'
import ProductList from './ProductList';
import GalleryProduct from './GalleryProduct';
import { TYPE_CONFIG } from './config';

export default async function TypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;

  if (!TYPE_SLUGS.includes(type as TypeSlug)) {
    notFound();
  }

  const config = TYPE_CONFIG[type as TypeSlug];
  const { title, data, filterField, visibleFields, layout } = config;

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
