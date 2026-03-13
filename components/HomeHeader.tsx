"use client";

import { useState } from 'react';
import { Search } from 'lucide-react';
import { SearchModal } from './SearchModal';

export function HomeHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between pt-6 pb-10 bg-gradient-to-b from-slate-50 from-80% to-transparent">
        <div className="w-10" /> {/* Spacer */}
        <h1 className="text-3xl font-bold tracking-tight text-emerald-600 flex-1 text-center">
          MAI VINH
        </h1>
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-2 text-slate-600 rounded-full transition-all bg-transparent"
          aria-label="Tìm kiếm"
        >
          <Search size={24} />
        </button>
      </div>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
