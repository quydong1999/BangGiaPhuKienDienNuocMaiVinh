import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ProductList from './ProductList';
import GalleryProduct from './GalleryProduct';
import { AddProductButton } from '@/components/AddProductButton';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { Product as ProductType, FilterField, VisibleField } from '@/types/types';

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

const getCachedProducts = (categoryId: string, slug: string) => unstable_cache(
  async () => {
    await connectDB();
    const data = await Product.find({ categoryId }).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(data));
  },
  [`products-${slug}`],
  { tags: [`products-${slug}`] }
)();

export async function generateStaticParams() {
  await connectDB();
  const categories = await Category.find({}, { slug: 1 }).lean();
  return categories.map((cat: any) => ({
    category: cat.slug,
  }));
}

async function ProductContent({ categoryId, categorySlug, layout, filterField, visibleFields }: { 
  categoryId: string, 
  categorySlug: string,
  layout: string, 
  filterField: any, 
  visibleFields: any 
}) {
  const products = await getCachedProducts(categoryId, categorySlug) as ProductType[];

  if (layout === 'table') {
    return (
      <ProductList
        data={products}
        filterField={filterField as FilterField}
        visibleFields={visibleFields as VisibleField[]}
        categoryId={categoryId}
      />
    );
  }

  return <GalleryProduct data={products} categoryId={categoryId} />;
}

function ProductSkeleton({ layout }: { layout: string }) {
  if (layout === 'table') {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-12 bg-white border border-slate-200 rounded shadow-sm" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(8)].map((_, i) => (
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

export default async function TypePage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categorySlug } = await params;
  
  const categoryData = await getCachedCategory(categorySlug);
  
  if (!categoryData) {
    notFound();
  }
  
  const { title, filterField = null, visibleFields = [], layout } = categoryData;

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header - Shown immediately after category fetch */}
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

      {/* Content - Streamed via Suspense */}
      <div className="flex-1 w-full max-w-6xl mx-auto p-4">
        <Suspense fallback={<ProductSkeleton layout={layout} />}>
          <ProductContent 
            categoryId={categoryData._id} 
            categorySlug={categorySlug}
            layout={layout} 
            filterField={filterField} 
            visibleFields={visibleFields} 
          />
        </Suspense>
      </div>

      <AddProductButton categoryId={categoryData._id.toString()} />
    </main>
  );
}

