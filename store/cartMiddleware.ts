import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { addToCart, removeFromCart, updateQuantity, clearCart, setCart } from './cartSlice';
import type { RootState } from './store';

export const cartListenerMiddleware = createListenerMiddleware();

cartListenerMiddleware.startListening({
  matcher: isAnyOf(addToCart, removeFromCart, updateQuantity, clearCart, setCart),
  effect: (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    try {
      localStorage.setItem('cart', JSON.stringify(state.cart.items));
    } catch {
      // localStorage might be unavailable (e.g. private browsing)
    }
  },
});
