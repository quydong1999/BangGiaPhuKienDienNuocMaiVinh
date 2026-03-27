"use client";

import { useCategories } from "@/hooks/useCategories";
import { Loader2 } from "lucide-react";

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CategorySelect({ value, onChange, disabled, className }: CategorySelectProps) {
  const { data: categories, isLoading, error } = useCategories();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 p-2.5 border border-gray-400 bg-slate-50">
        <Loader2 size={16} className="animate-spin" />
        Đang tải danh mục...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 p-2.5 border border-red-200 bg-red-50">
        Lỗi tải danh mục
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full p-2.5 border border-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow disabled:bg-slate-100 disabled:text-slate-500 ${className}`}
    >
      <option value="" disabled>-- Chọn danh mục --</option>
      {categories?.map((category) => (
        <option key={category._id} value={category._id}>
          {category.title}
        </option>
      ))}
    </select>
  );
}
