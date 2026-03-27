"use client";

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { closeModal } from '@/store/modalSlice';
import { useHotkey } from '@tanstack/react-hotkeys';
import dynamic from 'next/dynamic';
import { FlyToCartAnimation } from './FlyToCartAnimation';

import { AnimatePresence } from 'framer-motion';

const LoginModal = dynamic(() => import('./LoginModal').then(m => m.default), { ssr: false });
const SearchModal = dynamic(() => import('./SearchModal').then(m => m.SearchModal), { ssr: false });
const CategoryFormModal = dynamic(() => import('./CategoryFormModal').then(m => m.CategoryFormModal), { ssr: false });
const ProductFormModal = dynamic(() => import('./ProductFormModal').then(m => m.ProductFormModal), { ssr: false });
const ProductPreviewModal = dynamic(() => import('./ProductPreviewModal').then(m => m.ProductPreviewModal), { ssr: false });

export function ModalProvider() {
  const { type, isOpen, props } = useAppSelector((state) => state.modal);
  const dispatch = useAppDispatch();

  useHotkey('Escape', () => dispatch(closeModal()), { enabled: isOpen });

  return (
    <>
      <FlyToCartAnimation />
      <AnimatePresence>
        {isOpen && type === 'login' && (
          <LoginModal isOpen={isOpen} onClose={() => dispatch(closeModal())} />
        )}
        {isOpen && type === 'search' && (
          <SearchModal isOpen={isOpen} onClose={() => dispatch(closeModal())} />
        )}
        {isOpen && type === 'categoryForm' && (
          <CategoryFormModal isOpen={isOpen} onClose={() => dispatch(closeModal())} {...props} />
        )}
        {isOpen && type === 'productForm' && (
          <ProductFormModal isOpen={isOpen} onClose={() => dispatch(closeModal())} {...props} />
        )}
        {isOpen && type === 'productPreview' && (
          <ProductPreviewModal isOpen={isOpen} onClose={() => dispatch(closeModal())} {...props} />
        )}
      </AnimatePresence>
    </>
  );
}

