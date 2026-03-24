"use client";

import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setCart } from '@/store/cartSlice';
import type { CartItem } from '@/store/cartSlice';

export function CartHydration() {
  const dispatch = useAppDispatch();
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    try {
      const raw = localStorage.getItem('cart');
      if (raw) {
        const items: CartItem[] = JSON.parse(raw);
        if (Array.isArray(items) && items.length > 0) {
          dispatch(setCart(items));
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [dispatch]);

  return null;
}
