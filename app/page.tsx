"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { CategoryFormModal } from '@/components/CategoryFormModal';

const imgNotFoundUrl = "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?_=20210521171500";

export default function HomePage() {
  const { data: categories, isLoading, isError } = useCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-4 relative pb-24">
      <div className="w-full max-w-lg space-y-6">
        <div className="sticky top-0 z-10 text-center pt-6 pb-10 bg-gradient-to-b from-slate-50 from-80% to-transparent">
          <h1 className="text-3xl font-bold tracking-tight text-emerald-600">
            MAI VINH
          </h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : isError ? (
          <div className="text-center text-red-500 py-10 font-medium">
            Có lỗi xảy ra khi tải danh mục sản phẩm.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {categories?.map((category) => {
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
                      alt={category.shortTitle || category.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 256px"
                      className="object-cover"
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
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 hover:shadow-xl hover:-translate-y-1 transition-all z-40 active:scale-95 flex items-center justify-center"
        aria-label="Thêm danh mục mới"
      >
        <Plus size={28} />
      </button>

      {/* Category Creation Modal */}
      <CategoryFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </main>
  );
}
