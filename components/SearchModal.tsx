"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { motion } from 'framer-motion';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Small timeout to ensure the modal is rendered before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-900/60 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
        className="w-full max-w-2xl bg-white shadow-2xl rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSearch} className="relative flex items-center p-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm sản phẩm (tên, quy cách...)"
            className="w-full py-4 pl-12 pr-12 text-lg border-none outline-none placeholder:text-slate-400 text-slate-800"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={query.trim().length < 2}
            className="p-2 text-slate-600 rounded-full transition-all bg-transparent"
          >
            <Search size={24} />
          </button>
        </form>

        <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
          <span>Nhập ít nhất 2 ký tự để tìm kiếm</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
