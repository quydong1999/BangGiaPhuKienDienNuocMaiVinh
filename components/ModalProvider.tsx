"use client";

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { closeModal } from '@/store/modalSlice';
import dynamic from 'next/dynamic';

const LoginModal = dynamic(() => import('./LoginModal').then(m => m.default), { ssr: false });
const SearchModal = dynamic(() => import('./SearchModal').then(m => m.SearchModal), { ssr: false });
const CategoryFormModal = dynamic(() => import('./CategoryFormModal').then(m => m.CategoryFormModal), { ssr: false });
const ProductFormModal = dynamic(() => import('./ProductFormModal').then(m => m.ProductFormModal), { ssr: false });

export function ModalProvider() {
  const { type, isOpen, props } = useAppSelector((state) => state.modal);
  const dispatch = useAppDispatch();

  if (!type && !isOpen) return null;

  return (
    <>
      {type === 'login' && <LoginModal isOpen={isOpen} onClose={() => dispatch(closeModal())} />}
      {type === 'search' && <SearchModal isOpen={isOpen} onClose={() => dispatch(closeModal())} />}
      {type === 'categoryForm' && <CategoryFormModal isOpen={isOpen} onClose={() => dispatch(closeModal())} {...props} />}
      {type === 'productForm' && <ProductFormModal isOpen={isOpen} onClose={() => dispatch(closeModal())} {...props} />}
    </>
  );
}
