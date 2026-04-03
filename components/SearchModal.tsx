"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, ArrowRight, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';
import { formatVND } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/image-blur';

interface SearchSuggestion {
  _id: string;
  name: string;
  categoryShortTitle?: string;
  categorySlug?: string;
  images?: { secure_url?: string }[];
  specs?: { prices: { price: number; unit: string }[] }[];
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const imgNotFoundUrl = "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?_=20210521171500";

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebounce(query.trim(), 300);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    } else {
      setQuery('');
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Fetch suggestions on debounced query change
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const fetchSuggestions = async () => {
      // Cancel previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(debouncedQuery)}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        if (data.success) {
          setSuggestions((data.data as SearchSuggestion[]).slice(0, 8));
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Search suggestion error:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchSuggestions();

    return () => abortRef.current?.abort();
  }, [debouncedQuery]);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  // Navigate to full search page
  const navigateToSearch = useCallback((searchTerm: string) => {
    if (searchTerm.trim().length < 2) return;
    const encoded = encodeURIComponent(searchTerm.trim());
    onClose();
    setTimeout(() => router.push(`/search?q=${encoded}`), 50);
  }, [onClose, router]);

  // Navigate to product's category page
  const navigateToProduct = useCallback((item: SearchSuggestion) => {
    if (item.categorySlug) {
      onClose();
      setTimeout(() => router.push(`/${item.categorySlug}?productId=${item._id}`), 50);
    }
  }, [onClose, router]);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      navigateToProduct(suggestions[selectedIndex]);
    } else {
      navigateToSearch(query);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const total = suggestions.length;
    if (total === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < total - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : total - 1));
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-suggestion]');
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Helper: get price range text
  const getPriceText = (item: SearchSuggestion) => {
    const allPrices = item.specs?.flatMap(s => s.prices.map(p => p.price)) || [];
    if (allPrices.length === 0) return '';
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    return min === max ? formatVND(min) : `${formatVND(min)} - ${formatVND(max)}`;
  };

  // Highlight matched text in suggestion name
  const highlightMatch = (name: string, search: string) => {
    if (!search) return name;
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = name.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <span key={i} className="font-bold text-emerald-600">{part}</span>
        : <span key={i}>{part}</span>
    );
  };

  if (!isOpen) return null;

  const hasSuggestions = suggestions.length > 0;
  const showDropdown = debouncedQuery.length >= 2 && (hasSuggestions || isLoading);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-2 sm:pt-24 px-3 sm:px-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
        className={`w-full max-w-2xl bg-white shadow-2xl overflow-hidden ${showDropdown ? 'rounded-xl' : 'rounded-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <form onSubmit={handleSubmit} className="relative flex items-center px-4 sm:px-5 py-2.5 sm:py-3">
          <Search size={18} className="flex-shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm theo tên sản phẩm..."
            className="w-full py-1.5 sm:py-2 px-3 text-base border-none outline-none placeholder:text-slate-400 text-slate-800"
            autoComplete="off"
          />
          {isLoading ? (
            <Loader2 size={18} className="flex-shrink-0 text-slate-400 animate-spin" />
          ) : query.trim().length >= 2 ? (
            <button
              type="submit"
              className="flex-shrink-0 p-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
              aria-label="Tìm kiếm"
            >
              <ArrowRight size={16} />
            </button>
          ) : null}
        </form>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-slate-100" />

              {isLoading && suggestions.length === 0 ? (
                <div className="flex items-center gap-3 px-4 py-3 text-sm text-slate-400">
                  <Loader2 size={16} className="animate-spin" />
                  Đang tìm kiếm...
                </div>
              ) : hasSuggestions ? (
                <div ref={listRef} className="max-h-[40vh] overflow-y-auto overscroll-contain py-0.5">
                  {suggestions.map((item, index) => (
                    <button
                      key={item._id}
                      data-suggestion
                      type="button"
                      onClick={() => navigateToProduct(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-2.5 px-3 sm:px-4 py-1.5 text-left transition-colors cursor-pointer ${selectedIndex === index
                          ? 'bg-emerald-50'
                          : 'hover:bg-slate-50'
                        }`}
                    >
                      {/* Product Image */}
                      <div className="relative w-8 h-8 overflow-hidden bg-slate-100 flex-shrink-0">
                        <Image
                          src={getOptimizedImageUrl(item.images?.[0]?.secure_url ?? imgNotFoundUrl, 64)}
                          alt={item.name}
                          fill
                          sizes="32px"
                          className="object-cover"
                          quality={50}
                        />
                      </div>

                      {/* Product Name */}
                      <div className="flex-1 min-w-0 text-[13px] sm:text-sm text-slate-800 truncate">
                        {highlightMatch(item.name, debouncedQuery)}
                      </div>

                      {/* Price */}
                      {getPriceText(item) && (
                        <span className="flex-shrink-0 text-[12px] sm:text-[13px] font-semibold text-emerald-600 whitespace-nowrap">
                          {getPriceText(item)}
                        </span>
                      )}
                    </button>
                  ))}

                  {/* "View all results" link */}
                  <button
                    type="button"
                    onClick={() => navigateToSearch(query)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 border-t border-slate-100 transition-colors cursor-pointer"
                  >
                    <TrendingUp size={14} />
                    Xem tất cả kết quả cho &ldquo;{query.trim()}&rdquo;
                  </button>
                </div>
              ) : debouncedQuery.length >= 2 && !isLoading ? (
                <div className="flex flex-col items-center gap-1 px-4 py-4 text-slate-400">
                  <Search size={20} className="text-slate-200" />
                  <span className="text-sm">Không tìm thấy sản phẩm nào</span>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
