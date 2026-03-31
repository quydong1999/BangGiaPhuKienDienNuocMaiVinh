import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '@/types/types';
import type { RootState } from './store';

export interface CartItem {
  cartId: string; // productId + specName + unit
  product: Product;
  specName: string;
  unit: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{ product: Product; specName: string; unit: string; price: number; quantity: number }>) => {
      const { product, specName, unit, price, quantity } = action.payload;
      const cartId = `${product._id}-${specName}-${unit}`;
      
      const existing = state.items.find(item => item.cartId === cartId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ cartId, product, specName, unit, price, quantity });
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      // action.payload is cartId
      state.items = state.items.filter(item => item.cartId !== action.payload);
    },
    updateQuantity: (state, action: PayloadAction<{ cartId: string; quantity: number }>) => {
      const item = state.items.find(i => i.cartId === action.payload.cartId);
      if (item) {
        item.quantity = Math.max(0.01, action.payload.quantity);
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
    setCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, setCart } = cartSlice.actions;

// Selectors
export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartCount = (state: RootState) => state.cart.items.length;

export default cartSlice.reducer;
