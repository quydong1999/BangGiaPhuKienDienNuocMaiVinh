"use client";

import { useSkeleton } from "./providers/skeleton-provider";

export function PendingCategorySkeleton() {
  const { isAddingCategory, isRefreshing } = useSkeleton();

  if (!isAddingCategory && !isRefreshing) return null;

  return (
    <div className="animate-pulse bg-white border border-slate-200">
      <div className="aspect-square bg-slate-200" />
      <div className="p-3">
        <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto" />
      </div>
    </div>
  );
}

export function PendingProductSkeleton({ 
  categoryId, 
  layout,
  visibleFieldsCount = 2
}: { 
  categoryId: string;
  layout: "table" | "gallery";
  visibleFieldsCount?: number;
}) {
  const { pendingProductCategoryId, isRefreshing } = useSkeleton();

  if (pendingProductCategoryId !== categoryId && !isRefreshing) return null;

  if (layout === "table") {
    return (
      <tr className="animate-pulse">
        {Array.from({ length: visibleFieldsCount }).map((_, i) => (
          <td key={i} className="px-4 py-3">
            <div className="h-4 bg-slate-200 rounded w-full" />
          </td>
        ))}
      </tr>
    );
  }

  return (
    <div className="animate-pulse bg-white border border-slate-200">
      <div className="aspect-[4/3] bg-slate-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  );
}
