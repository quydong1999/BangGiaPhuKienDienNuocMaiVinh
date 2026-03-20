"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, LogOut, LogIn, UserRound } from 'lucide-react';
import { signOut } from "next-auth/react"
import { useAdmin } from "@/hooks/useAdmin"
import dynamic from 'next/dynamic';

const SearchModal = dynamic(() => import('./SearchModal').then(mod => mod.SearchModal), { ssr: false });
const LoginModal = dynamic(() => import('./LoginModal').then(mod => mod.default), { ssr: false });

export function HomeHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { isAdmin, isLoading, user } = useAdmin()
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      <header className="sticky top-0 z-10 flex items-center justify-between pt-6 pb-10 bg-gradient-to-b from-slate-50 from-80% to-transparent">

        {/* Trái: Avatar */}
        <div className="w-10 flex items-center justify-start">
          {!isLoading && (
            <div className="relative" ref={dropdownRef}>

              {/* Avatar */}
              <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="w-8 h-8 rounded-full overflow-hidden transition-all focus:outline-none
                  cursor-pointer"
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
                <div className="absolute left-0 top-10 flex flex-col bg-white rounded-xl shadow-lg border border-slate-100 p-2 min-w-max gap-1">
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
                      onClick={() => { setIsLoginOpen(true); setIsDropdownOpen(false); }}
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

        {/* Giữa: Logo */}
        <h1 className="text-3xl font-bold tracking-tight text-emerald-600 flex-1 text-center">
          MAI VINH
        </h1>

        {/* Phải: Search */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-2 text-slate-600 rounded-full transition-all bg-transparent"
          aria-label="Tìm kiếm"
        >
          <Search size={24} />
        </button>

      </header>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}