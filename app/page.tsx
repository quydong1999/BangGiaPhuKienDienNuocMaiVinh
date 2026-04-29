import { Suspense } from 'react';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
import { MainLayout } from '@/components/MainLayout';
import { FavoriteProductsGrid } from '@/components/FavoriteProductsGrid';



function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse bg-white border border-slate-200">
          <div className="aspect-[4/3] bg-slate-200" />
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
    <MainLayout compactHeader showAddCategory>
      <div className="w-full max-w-6xl mx-auto space-y-6 p-4 mt-2 pb-24">
        <section aria-label="Sản phẩm yêu thích">
          <h2 className="text-lg font-bold text-slate-800 mb-4 px-2 sm:px-0">Sản phẩm yêu thích</h2>
          <Suspense fallback={<GridSkeleton />}>
            <FavoriteProductsGrid />
          </Suspense>
        </section>
      </div>
    </MainLayout>
  );
}
