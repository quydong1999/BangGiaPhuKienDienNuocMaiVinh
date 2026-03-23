"use client";

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAdmin } from "@/hooks/useAdmin"
import LoginModal from "@/components/LoginModal"
import dynamic from 'next/dynamic';

const ProductFormModal = dynamic(() => import('./ProductFormModal').then(mod => mod.ProductFormModal), { ssr: false });

interface AddProductButtonProps {
  categoryId: string;
  showImageField?: boolean;
}

export function AddProductButton({ categoryId, showImageField = true }: AddProductButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAdmin } = useAdmin()
  const [showLogin, setShowLogin] = useState(false)

  const handleClick = () => {
    if (isAdmin) {
      setIsModalOpen(true)
    } else {
      setShowLogin(true)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:text-emerald-800 rounded-md text-sm font-medium transition-colors shadow-sm whitespace-nowrap z-10 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
        aria-label="Thêm sản phẩm"
      >
        <Plus size={16} className="-ml-0.5" />
        <span className="hidden sm:inline">Thêm sản phẩm</span>
        <span className="sm:hidden">Thêm</span>
      </button>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryId={categoryId}
        showImageField={showImageField}
      />
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
      />
    </>
  );
}
