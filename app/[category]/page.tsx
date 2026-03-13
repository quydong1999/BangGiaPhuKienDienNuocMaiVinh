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

export default async function TypePage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categorySlug } = await params;
  
  await connectDB();
  
  const categoryDataRaw = await Category.findOne({ slug: categorySlug }).lean();
  
  if (!categoryDataRaw) {
    notFound();
  }
  
  const categoryData = JSON.parse(JSON.stringify(categoryDataRaw));

  const productsDataRaw = await Product.find({ categoryId: categoryData._id }).sort({ createdAt: -1 }).lean();
  const products = JSON.parse(JSON.stringify(productsDataRaw)) as ProductType[];

  const { title, filterField = null, visibleFields = [], layout } = categoryData;

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
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

      {/* Content */}
      <div className="flex-1 w-full max-w-6xl mx-auto p-4">
        {layout === 'table' ? (
          <ProductList
            data={products}
            filterField={filterField as FilterField}
            visibleFields={visibleFields as VisibleField[]}
          />
        ) : (
          <GalleryProduct data={products} />
        )}
      </div>

      <AddProductButton categoryId={categoryData._id.toString()} />
    </main>
  );
}
