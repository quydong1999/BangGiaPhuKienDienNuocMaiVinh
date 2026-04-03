"use client";
import { useEffect } from 'react';

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { closeModal } from '@/store/modalSlice';
import { useHotkey } from '@tanstack/react-hotkeys';
import dynamic from 'next/dynamic';
import { FlyToCartAnimation } from './FlyToCartAnimation';
import { AnimatePresence } from 'framer-motion';
import { useAdmin } from '@/hooks/useAdmin';

const MODAL_COMPONENTS = {
  login: dynamic(() => import('./LoginModal').then(m => m.default), { ssr: false }),
  search: dynamic(() => import('./SearchModal').then(m => m.SearchModal), { ssr: false }),
  categoryForm: dynamic(() => import('./CategoryFormModal').then(m => m.CategoryFormModal), { ssr: false }),
  productForm: dynamic(() => import('./ProductFormModal').then(m => m.ProductFormModal), { ssr: false }),
  productPreview: dynamic(() => import('./ProductPreviewModal').then(m => m.ProductPreviewModal), { ssr: false }),
  bulkImport: dynamic(() => import('./BulkImportModal').then(m => m.BulkImportModal), { ssr: false }),
  saveInvoice: dynamic(() => import('./SaveInvoiceModal').then(m => m.SaveInvoiceModal), { ssr: false }),
  editInvoice: dynamic(() => import('./EditInvoiceModal').then(m => m.EditInvoiceModal), { ssr: false }),
} as const;

export type ModalType = keyof typeof MODAL_COMPONENTS;

export function ModalProvider() {
  const { type, isOpen, props } = useAppSelector((state) => state.modal);
  const { isAdmin, isLoading } = useAdmin();
  const dispatch = useAppDispatch();

  useHotkey('Escape', () => dispatch(closeModal()), { enabled: isOpen });
  // Prevent background scrolling when a modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup on unmount or when isOpen changes
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Prevent browser back from navigating away when modal is open
  useEffect(() => {
    if (!isOpen) return;

    // Push a new entry to the history stack
    window.history.pushState({ modalOpen: true }, '');

    const handlePopState = () => {
      // If back button is pressed, close the modal
      dispatch(closeModal());
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      
      // If the modal was closed via UI (not back button), remove the history entry we added
      if (window.history.state?.modalOpen) {
        window.history.back();
      }
    };
  }, [isOpen, dispatch]);

  let ActiveModal = type ? MODAL_COMPONENTS[type] : null;

  // Authorization check for protected modals (only for editing existing items)
  const PROTECTED_MODALS: ModalType[] = ['categoryForm', 'productForm', 'bulkImport'];
  if (isOpen && type && PROTECTED_MODALS.includes(type) && props?.initialData && !isAdmin) {
    if (isLoading) return null; // Wait for session to load
    ActiveModal = MODAL_COMPONENTS.login;
  }

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