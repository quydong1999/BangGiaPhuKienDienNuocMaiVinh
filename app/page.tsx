import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getBlurPlaceholder } from '@/lib/image-blur';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
import { AddCategoryButton } from '@/components/AddCategoryButton';
import { PendingCategorySkeleton } from '@/components/PendingSkeletons';
import { HomeHeader } from '@/components/HomeHeader';
import { unstable_cache } from 'next/cache';

const imgNotFoundUrl = "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?_=20210521171500";

const getCachedCategories = unstable_cache(
  async () => {
    await connectDB();
    const categoriesRaw = await Category.find({}).sort({ createdAt: 1 }).lean();
    return JSON.parse(JSON.stringify(categoriesRaw));
  },
  ['categories-list'],
  { tags: ['categories-list'] }
);

async function CategoryGrid() {
  const categories = await getCachedCategories();

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center text-slate-500 py-10 font-medium">
        Chưa có danh mục sản phẩm nào.
      </div>
    );
  }

  return (
    <nav aria-label="Danh mục sản phẩm" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {categories.map((category: any, index: number) => {
        return (
          <Link
            key={category.slug}
            href={`/${category.slug}`}
            className="group relative flex flex-col overflow-hidden bg-white shadow-lg hover:shadow-xl border border-slate-200 hover:border-slate-300 transition-all active:scale-[0.98]"
          >
            {/* Square image container */}
            <div className="relative aspect-square w-full">
              <Image
                src={category.image?.secure_url || category.image?.url || imgNotFoundUrl}
                alt={`Danh mục ${category.shortTitle || category.title}`}
                fill
                sizes="(max-width: 640px) 50vw, 256px"
                className="object-cover"
                priority={index === 0}
                {...getBlurPlaceholder(category.image?.secure_url || category.image?.url)}
              />
            </div>
            {/* Title */}
            <div className="px-2 py-3 bg-white">
              <p className="text-sm font-medium text-slate-800 text-center leading-tight">
                {category.shortTitle || category.title}
              </p>
            </div>
          </Link>
        );
      })}
      <PendingCategorySkeleton />
    </nav>
  );
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
            <CategoryGrid />
          </Suspense>
        </section>
      </div>

      <AddCategoryButton />
    </main>
  );
}
