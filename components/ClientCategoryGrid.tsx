"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getBlurPlaceholder } from "@/lib/image-blur";
import { PendingCategorySkeleton } from "@/components/PendingSkeletons";
import { useAdmin } from "@/hooks/useAdmin"
import { useCategories } from "@/hooks/useCategories";
import LoginModal from "@/components/LoginModal"
import dynamic from "next/dynamic";

const CategoryFormModal = dynamic(
  () => import("@/components/CategoryFormModal").then((mod) => mod.CategoryFormModal),
  { ssr: false }
);

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
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);
  const { isAdmin } = useAdmin()
  const [showLogin, setShowLogin] = useState(false)

  const handleEditClick = (e: React.MouseEvent, category: CategoryWithCount) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdmin) {
      setEditingCategory(category);
    } else {
      setShowLogin(true);
    }
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
            </a>
          );
        })}
        <PendingCategorySkeleton />
      </nav>

      {/* Edit Modal */}
      <CategoryFormModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        initialData={editingCategory}
        productCount={editingCategory?.productCount || 0}
      />
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
      />
    </>
  );
}
