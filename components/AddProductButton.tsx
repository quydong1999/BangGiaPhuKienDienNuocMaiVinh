"use client";

import { useState } from 'react';
import { Plus } from 'lucide-react';
import dynamic from 'next/dynamic';

const ProductFormModal = dynamic(() => import('./ProductFormModal').then(mod => mod.ProductFormModal), { ssr: false });

interface AddProductButtonProps {
  categoryId: string;
  showImageField?: boolean;
}

export function AddProductButton({ categoryId, showImageField = true }: AddProductButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 hover:shadow-xl hover:-translate-y-1 transition-all z-40 active:scale-95 flex items-center justify-center"
        aria-label="Thêm sản phẩm mới"
      >
        <Plus size={28} />
      </button>

      <ProductFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        categoryId={categoryId}
        showImageField={showImageField}
      />
    </>
  );
}
