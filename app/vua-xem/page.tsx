import { Suspense } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { RecentViewedProductsGrid } from '@/components/RecentViewedProductsGrid';

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

export default function RecentViewedPage() {
  return (
    <MainLayout compactHeader showAddCategory>
      <div className="w-full max-w-5xl mx-auto space-y-6 p-4 mt-2 pb-24">
        <section aria-label="Sản phẩm vừa xem">
          <h2 className="text-lg font-bold text-slate-800 mb-4 px-2 sm:px-0">Sản phẩm vừa xem</h2>
          <Suspense fallback={<GridSkeleton />}>
            <RecentViewedProductsGrid />
          </Suspense>
        </section>
      </div>
    </MainLayout>
  );
}
