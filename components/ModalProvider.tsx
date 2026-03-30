"use client";

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { closeModal } from '@/store/modalSlice';
import { useHotkey } from '@tanstack/react-hotkeys';
import dynamic from 'next/dynamic';
import { FlyToCartAnimation } from './FlyToCartAnimation';
import { AnimatePresence } from 'framer-motion';

const MODAL_COMPONENTS = {
  login: dynamic(() => import('./LoginModal').then(m => m.default), { ssr: false }),
  search: dynamic(() => import('./SearchModal').then(m => m.SearchModal), { ssr: false }),
  categoryForm: dynamic(() => import('./CategoryFormModal').then(m => m.CategoryFormModal), { ssr: false }),
  productForm: dynamic(() => import('./ProductFormModal').then(m => m.ProductFormModal), { ssr: false }),
  productPreview: dynamic(() => import('./ProductPreviewModal').then(m => m.ProductPreviewModal), { ssr: false }),
} as const;

export type ModalType = keyof typeof MODAL_COMPONENTS;

export function ModalProvider() {
  const { type, isOpen, props } = useAppSelector((state) => state.modal);
  const dispatch = useAppDispatch();

  useHotkey('Escape', () => dispatch(closeModal()), { enabled: isOpen });

  const ActiveModal = type ? MODAL_COMPONENTS[type] : null;

  return (
    <>
      <FlyToCartAnimation />
      <AnimatePresence>
        {isOpen && ActiveModal && (
          <ActiveModal
            isOpen={isOpen}
            onClose={() => dispatch(closeModal())}
            {...props}
          />
        )}
      </AnimatePresence>
    </>
  );
}