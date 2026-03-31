'use client';

import { useProducts } from '@/hooks/useProducts';
import ProductList from './ProductList';
import GalleryProduct from './GalleryProduct';
import { FilterField, Product, VisibleField } from '@/types/types';

interface ProductContainerProps {
  categoryId: string;
  categorySlug: string;
  layout: string;
  filterField: any;
  visibleFields: any;
  initialProducts: Product[];
  categoryImageUrl?: string;
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

export default function ProductContainer({ 
  categoryId, 
  categorySlug, 
  layout, 
  filterField, 
  visibleFields,
  initialProducts,
  categoryImageUrl 
}: ProductContainerProps) {
  const { data: products, isLoading, error } = useProducts(categoryId, initialProducts);

  if (isLoading) {
    return <ProductSkeleton layout={layout} />;
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 border border-red-200 rounded-lg">
        Có lỗi xảy ra khi tải danh sách sản phẩm. Vui lòng thử lại sau.
      </div>
    );
  }

  const data = products || [];

  if (layout === 'table') {
    return (
      <ProductList
        data={data}
        filterField={filterField as FilterField}
        visibleFields={visibleFields as VisibleField[]}
        categoryId={categoryId}
        categoryImageUrl={categoryImageUrl}
      />
    );
  }

  return <GalleryProduct data={data} categoryId={categoryId} filterField={filterField as FilterField} />;
}
