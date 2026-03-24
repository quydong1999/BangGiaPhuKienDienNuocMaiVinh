import { configureStore } from '@reduxjs/toolkit';
import modalReducer from './modalSlice';
import cartReducer from './cartSlice';
import { cartListenerMiddleware } from './cartMiddleware';

export const store = configureStore({
  reducer: {
    modal: modalReducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(cartListenerMiddleware.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
