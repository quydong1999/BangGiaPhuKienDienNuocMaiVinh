"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, LogOut, LogIn, UserRound, Menu } from 'lucide-react';
import { signOut } from "next-auth/react"
import { useAdmin } from "@/hooks/useAdmin"
import Link from 'next/link';
import { useAppDispatch } from '@/store/hooks';
import { openModal } from '@/store/modalSlice';

interface HomeHeaderProps {
  compact?: boolean;
}

export function HomeHeader({ compact = false }: HomeHeaderProps = {}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isAdmin, isLoading, user } = useAdmin()
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className={`sticky top-0 z-30 w-full ${compact ? 'bg-emerald-600 shadow-md text-white' : ''}`}>
        <div className={`mx-auto w-full max-w-6xl flex flex-wrap sm:flex-nowrap items-center justify-between ${compact ? 'px-3 sm:px-4 py-2 sm:h-16 gap-y-2 sm:gap-4' : 'px-4 pt-6 pb-10'}`}>

          {/* Trái: Menu & Logo */}
          <div className="flex items-center gap-2 sm:gap-3 order-1 flex-shrink-0">
            <Link href="/" className="block focus:outline-none">
              <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${compact ? 'text-white' : 'text-emerald-600'}`}>
                MAI VINH
              </h1>
            </Link>
          </div>

          {/* Giữa (Mobile: Row 2, Desktop: Row 1): Search Textbox */}
          <div className="w-full sm:flex-1 order-3 sm:order-2 sm:max-w-2xl sm:mx-4 z-10">
            <button
              onClick={() => dispatch(openModal({ type: 'search' }))}
              className={`w-full flex items-center gap-2 h-10 px-3 sm:px-4 rounded-lg transition-all border text-sm focus:outline-none ${compact
                ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white/90 shadow-inner'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500 shadow-sm'
                }`}
              aria-label="Tìm kiếm sản phẩm"
            >
              <Search size={18} className="flex-shrink-0" />
              <span className="truncate">Tìm kiếm sản phẩm</span>
            </button>
          </div>

          {/* Phải: Avatar */}
          <div className="flex items-center justify-end w-10 order-2 sm:order-3 flex-shrink-0 z-20">
            {!isLoading && (
              <div className="relative" ref={dropdownRef}>

                {/* Avatar */}
                <button
                  onClick={() => setIsDropdownOpen(prev => !prev)}
                  className={`w-8 h-8 rounded-full overflow-hidden transition-all focus:outline-none cursor-pointer border ${compact ? 'border-white/30' : 'border-slate-200'}`}
                >
                  {isAdmin && user?.image ? (
                    <img
                      src={user.image}
                      alt={user.name ?? 'Admin'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                      <UserRound size={16} className="text-slate-400" />
                    </div>
                  )}
                </button>

                {/* Dropdown */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-10 flex flex-col bg-white rounded-xl shadow-lg border border-slate-100 p-2 min-w-max gap-1">
                    {isAdmin ? (
                      <>
                        <p className="text-xs text-slate-400 px-2 pt-1 pb-0.5 font-medium truncate max-w-[160px]">
                          {user?.name}
                        </p>
                        <button
                          onClick={() => { signOut(); setIsDropdownOpen(false); }}
                          className="flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 rounded-lg px-2 py-1.5 transition-colors"
                        >
                          <LogOut size={14} />
                          Đăng xuất
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { dispatch(openModal({ type: 'login' })); setIsDropdownOpen(false); }}
                        className="flex items-center gap-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors"
                      >
                        <LogIn size={14} />
                        Đăng nhập
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </header>
    </>
  );
}