"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';

interface FlyingItem {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

let flyId = 0;

export function FlyToCartAnimation() {
  const [items, setItems] = useState<FlyingItem[]>([]);

  const handleFlyToCart = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail as { startX: number; startY: number };

    // Find the cart icon target position
    const cartEl = document.getElementById('header-cart-icon');
    if (!cartEl) return;

    const cartRect = cartEl.getBoundingClientRect();
    const endX = cartRect.left + cartRect.width / 2;
    const endY = cartRect.top + cartRect.height / 2;

    const newItem: FlyingItem = {
      id: ++flyId,
      startX: detail.startX,
      startY: detail.startY,
      endX,
      endY,
    };

    setItems(prev => [...prev, newItem]);
  }, []);

  useEffect(() => {
    window.addEventListener('fly-to-cart', handleFlyToCart);
    return () => window.removeEventListener('fly-to-cart', handleFlyToCart);
  }, [handleFlyToCart]);

  const handleComplete = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <AnimatePresence>
      {items.map(item => {
        const dx = item.endX - item.startX;
        const dy = item.endY - item.startY;

        return (
          <motion.div
            key={item.id}
            initial={{
              position: 'fixed',
              left: item.startX,
              top: item.startY,
              x: '-50%',
              y: '-50%',
              scale: 1,
              opacity: 1,
              zIndex: 9999,
            }}
            animate={{
              left: [item.startX, item.startX + dx * 0.3, item.endX],
              top: [item.startY, item.startY + dy * 0.3 - 80, item.endY],
              scale: [1, 0.8, 0.3],
              opacity: [1, 1, 0.6],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: 0.65,
              ease: [0.2, 0, 0.2, 1],
            }}
            onAnimationComplete={() => handleComplete(item.id)}
            className="pointer-events-none"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 flex items-center justify-center text-white">
              <ShoppingCart size={16} />
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
