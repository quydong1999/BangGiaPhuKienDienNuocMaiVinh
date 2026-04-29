'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRef } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { X, Star, ChevronRight, History } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { openModal } from '@/store/modalSlice';
import { getOptimizedImageUrl, getBlurPlaceholder } from '@/lib/image-blur';
import Image from 'next/image';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const imgNotFoundUrl = "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?_=20210521171500";

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isModalOpen = useAppSelector(state => state.modal.isOpen);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);
  const { data: categories, isLoading } = useCategories();

  const handleEditClick = (e: React.MouseEvent, category: any) => {
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

  const handleCategoryClick = (e: React.MouseEvent, category: any) => {
    e.preventDefault();

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
        onClose();
      }, 250);
    }
  };

  return (
    <>
      {/* Overlay cho mobile */}
      {isOpen && (
        <div
          className={`fixed inset-0 bg-black/50 ${isModalOpen ? 'z-40' : 'z-[60]'} lg:hidden`}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — trên desktop: h-full, overflow-y-auto, scroll độc lập */}
      <aside
        className={`
          fixed inset-y-0 left-0 ${isModalOpen ? 'z-40' : 'z-[60]'} w-64 bg-white border-r border-slate-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}

          lg:relative lg:translate-x-0 lg:shadow-none
          lg:w-64 lg:flex-shrink-0 lg:h-full
          flex flex-col
        `}
      >
        {/* Tiêu đề — cố định, không cuộn */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="font-bold text-slate-800 tracking-wide uppercase text-sm">
            Danh mục
          </h2>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-slate-500 hover:bg-slate-100 rounded-md"
          >
            <X size={20} />
          </button>
        </div>

        {/* Danh sách — cuộn được, chiếm hết phần còn lại */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-2 custom-scrollbar">
          <ul className="space-y-1 px-2">
            <li>
              <Link
                href="/"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === '/'
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                  <Star size={20} className={pathname === '/' ? 'text-teal-600 fill-teal-600' : 'text-slate-400'} />
                </div>
                <span>Yêu thích</span>
              </Link>
            </li>

            <li>
              <Link
                href="/vua-xem"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === '/vua-xem'
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                  <History size={20} className={pathname === '/vua-xem' ? 'text-teal-600' : 'text-slate-400'} />
                </div>
                <span>Vừa xem</span>
              </Link>
            </li>

            <li className="my-2 border-t border-slate-100"></li>

            {isLoading ? (
              <div className="px-3 py-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-7 h-7 bg-slate-200 rounded-full" />
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : (
              categories?.map((cat: any) => {
                const isActive = pathname === `/${cat.slug}`;
                const imageUrl = cat.image?.secure_url || cat.image?.url || imgNotFoundUrl;

                return (
                  <li key={cat.slug}>
                    <Link
                      href={`/${cat.slug}`}
                      onClick={(e) => handleCategoryClick(e, cat)}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none ${isActive
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-7 h-7 flex-shrink-0 overflow-hidden rounded-full border border-slate-200">
                          <Image
                            src={getOptimizedImageUrl(imageUrl, 50)}
                            alt={cat.title}
                            fill
                            sizes="28px"
                            className="object-cover"
                            {...getBlurPlaceholder(imageUrl)}
                          />
                        </div>
                        <span className="truncate" title={cat.title}>
                          {cat.shortTitle || cat.title}
                        </span>
                      </div>
                      {isActive && <ChevronRight size={16} className="text-teal-600 flex-shrink-0" />}
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
}
