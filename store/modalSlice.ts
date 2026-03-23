import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ModalType = 'login' | 'search' | 'categoryForm' | 'productForm' | null;

interface ModalState {
  type: ModalType;
  isOpen: boolean;
  props: any;
}

const initialState: ModalState = {
  type: null,
  isOpen: false,
  props: {},
};

export const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    openModal: (state, action: PayloadAction<{ type: ModalType; props?: any }>) => {
      state.type = action.payload.type;
      state.props = action.payload.props || {};
      state.isOpen = true;
    },
    closeModal: (state) => {
      state.isOpen = false;
      // Note: We don't reset `type` so that Framer Motion exit animations can finish
    },
  },
});

export const { openModal, closeModal } = modalSlice.actions;
export default modalSlice.reducer;
