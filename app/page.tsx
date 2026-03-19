import { Suspense } from 'react';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
import { AddCategoryButton } from '@/components/AddCategoryButton';
import { HomeHeader } from '@/components/HomeHeader';
import { unstable_cache } from 'next/cache';
import { ClientCategoryGrid } from '@/components/ClientCategoryGrid';

const getCachedCategories = unstable_cache(
  async () => {
    await connectDB();
    const categoriesRaw = await Category.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'products'
        }
      },
      {
        $addFields: {
          productCount: { $size: '$products' }
        }
      },
      {
        $project: {
          products: 0
        }
      },
      {
        $sort: { createdAt: 1 }
      }
    ]);
    return JSON.parse(JSON.stringify(categoriesRaw));
  },
  ['categories-list'],
  { tags: ['categories-list'] }
);

async function CategoryGridFetcher() {
  const categories = await getCachedCategories();
  return <ClientCategoryGrid categories={categories} />;
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse bg-white border border-slate-200">
          <div className="aspect-square bg-slate-200" />
          <div className="p-3">
            <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen bg-slate-50 flex flex-col items-center p-4 relative pb-24">
      <div className="w-full max-w-5xl space-y-6">
        <HomeHeader />

        <section aria-label="Danh mục sản phẩm">
          <h2 className="sr-only">Danh mục sản phẩm</h2>
          <Suspense fallback={<GridSkeleton />}>
            <CategoryGridFetcher />
          </Suspense>
        </section>
      </div>

      <AddCategoryButton />
    </main>
  );
}
