"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getBlurPlaceholder, getOptimizedImageUrl } from "@/lib/image-blur";
import { PendingCategorySkeleton } from "@/components/PendingSkeletons";
import { useCategories } from "@/hooks/useCategories";
import { useAppDispatch } from "@/store/hooks";
import { openModal } from "@/store/modalSlice";

interface CategoryWithCount {
  _id: string;
  slug: string;
  title: string;
  shortTitle?: string;
  image?: {
    public_id?: string;
    url?: string;
    secure_url?: string;
  };
  layout?: "table" | "gallery";
  filterField?: string;
  visibleFields?: string[];
  productCount?: number;
}

interface ClientCategoryGridProps {
  categories: CategoryWithCount[];
}

const imgNotFoundUrl =
  "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?_=20210521171500";

export function ClientCategoryGrid({ categories: initialCategories }: ClientCategoryGridProps) {
  const router = useRouter();
  const { data: categories = initialCategories } = useCategories(initialCategories as any);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);
  const dispatch = useAppDispatch();

  const handleEditClick = (e: React.MouseEvent, category: CategoryWithCount) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(openModal({
      type: 'categoryForm',
      props: {
        initialData: category,
        productCount: category.productCount || 0
      }
    }));
  };

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center text-slate-500 py-10 font-medium">
        Chưa có danh mục sản phẩm nào.
      </div>
    );
  }

  const handleCategoryClick = (category: CategoryWithCount, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent native navigation

    if (clickTimer.current) {
      // Double click
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      handleEditClick(e, category);
    } else {
      // Single click
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        router.push(`/${category.slug}`);
      }, 250);
    }
  };

  return (
    <>
      <nav
        aria-label="Danh mục sản phẩm"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      >
        {categories.map((category: CategoryWithCount, index: number) => {
          return (
            <a
              key={category.slug}
              href={`/${category.slug}`}
              onClick={(e) => handleCategoryClick(category, e)}
              className="group relative flex flex-col overflow-hidden bg-white shadow-lg hover:shadow-xl border border-slate-200 hover:border-slate-300 transition-all active:scale-[0.98]"
            >
              {/* Square image container */}
              <div className="relative aspect-square w-full">
                <Image
                  src={getOptimizedImageUrl(category.image?.secure_url || category.image?.url || imgNotFoundUrl, 400)}
                  alt={`Danh mục ${category.shortTitle || category.title}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 256px"
                  className="object-cover"
                  priority={index < 5}
                  quality={60}
                  {...getBlurPlaceholder(category.image?.secure_url || category.image?.url)}
                />
              </div>
              {/* Title */}
              <div className="px-2 py-3 bg-white">
                <p className="text-sm font-medium text-slate-800 text-center leading-tight">
                  {category.shortTitle || category.title}
                </p>
              </div>
            </a>
          );
        })}
        <PendingCategorySkeleton />
      </nav>

    </>
  );
}
