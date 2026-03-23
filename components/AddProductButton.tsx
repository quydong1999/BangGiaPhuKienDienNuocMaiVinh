"use client";

import { Plus } from 'lucide-react';
import { useAdmin } from "@/hooks/useAdmin"
import { useAppDispatch } from '@/store/hooks';
import { openModal } from '@/store/modalSlice';

interface AddProductButtonProps {
  categoryId: string;
  showImageField?: boolean;
}

export function AddProductButton({ categoryId, showImageField = true }: AddProductButtonProps) {
  const { isAdmin, isLoading } = useAdmin();
  const dispatch = useAppDispatch();

  if (isLoading || !isAdmin) return null;

  return (
    <>
      <button
        onClick={() => dispatch(openModal({ 
          type: 'productForm', 
          props: { categoryId, showImageField } 
        }))}
        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:text-emerald-800 rounded-md text-sm font-medium transition-colors shadow-sm whitespace-nowrap z-10 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
        aria-label="Thêm sản phẩm"
      >
        <Plus size={16} className="-ml-0.5" />
        <span className="hidden sm:inline">Thêm sản phẩm</span>
        <span className="sm:hidden">Thêm</span>
      </button>
    </>
  );
}
