'use client';

import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { isFavoriteProduct, toggleFavoriteProduct, FAVORITES_UPDATED_EVENT } from '@/lib/favorites';

interface FavoriteButtonProps {
  productId: string;
}

export function FavoriteButton({ productId }: FavoriteButtonProps) {
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    // Initial check
    setIsFav(isFavoriteProduct(productId));

    // Listen for updates
    const handleUpdate = () => {
      setIsFav(isFavoriteProduct(productId));
    };

    window.addEventListener(FAVORITES_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(FAVORITES_UPDATED_EVENT, handleUpdate);
  }, [productId]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = toggleFavoriteProduct(productId);
    setIsFav(newState);
  };

  return (
    <button
      onClick={handleClick}
      className="absolute top-1 right-1 p-1 rounded-sm bg-white/80 hover:bg-white text-slate-400 hover:text-amber-300 hover:scale-110 transition-all shadow-sm z-10 focus:outline-none"
      aria-label={isFav ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
    >
      <Bookmark
        size={18}
        className={isFav ? "text-amber-300 fill-amber-300" : ""}
      />
    </button>
  );
}
