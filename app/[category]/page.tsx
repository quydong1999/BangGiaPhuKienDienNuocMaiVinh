import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ProductContainer from './ProductContainer';
import { AddProductButton } from '@/components/AddProductButton';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';

import { unstable_cache } from 'next/cache';

const getCachedCategory = (slug: string) => unstable_cache(
  async () => {
    await connectDB();
    const data = await Category.findOne({ slug }).lean();
    return data ? JSON.parse(JSON.stringify(data)) : null;
  },
  [`category-${slug}`],
  { tags: [`category-${slug}`, 'categories'] }
)( );

export async function generateStaticParams() {
  await connectDB();
  const categories = await Category.find({}, { slug: 1 }).lean();
  return categories.map((cat: any) => ({
    category: cat.slug,
  }));
}

export default async function TypePage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categorySlug } = await params;
  
  const categoryData = await getCachedCategory(categorySlug);
  
  if (!categoryData) {
    notFound();
  }
  
  const { _id, title, filterField = null, visibleFields = [], layout } = categoryData;
  const categoryId = _id.toString();

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header - Shown immediately (SSG) */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center h-14 px-4 max-w-6xl mx-auto w-full">
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

      {/* Content - Client-side fetching via ProductContainer */}
      <div className="flex-1 w-full max-w-6xl mx-auto p-4">
        <ProductContainer 
          categoryId={categoryId} 
          categorySlug={categorySlug}
          layout={layout} 
          filterField={filterField} 
          visibleFields={visibleFields} 
        />
      </div>

      <AddProductButton 
        categoryId={categoryId} 
        showImageField={layout !== 'table'}
      />
    </main>
  );
}

