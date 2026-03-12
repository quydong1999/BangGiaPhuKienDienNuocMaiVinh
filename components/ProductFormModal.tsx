"use client";

import { useState, useEffect } from "react";
import { useCreateProduct } from "@/hooks/useProducts";
import { X, Upload, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import imageCompression from "browser-image-compression";

// Zod Schema Definition
const productSchema = z.object({
  name: z.string().min(1, { message: "Tên sản phẩm không được bỏ trống" }),
  spec: z.string().optional(),
  unit: z.string().min(1, { message: "Đơn vị không được bỏ trống" }),
  priceSell: z.number().min(1, { message: "Giá bán không được bỏ trống" }),
  image: z.any().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const formatVND = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
};

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
}

export function ProductFormModal({ isOpen, onClose, categoryId }: ProductFormModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      spec: "",
      unit: "",
      priceSell: "" as any,
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        name: "",
        spec: "",
        unit: "",
        priceSell: "" as any,
      });
      setSubmitError(null);
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [isOpen, reset]);

  // Handle object url memory cleanup
  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const mutation = useCreateProduct();

  const onSubmit = (data: ProductFormValues) => {
    setSubmitError(null);
    const formData = new FormData();

    formData.append("name", data.name);
    formData.append("priceSell", formatVND(data.priceSell));
    formData.append("categoryId", categoryId);

    if (data.spec) formData.append("spec", data.spec);
    if (data.unit) formData.append("unit", data.unit);

    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    mutation.mutate(formData, {
      onSuccess: () => {
        onClose();
      },
      onError: (err: any) => {
        setSubmitError(err.message);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center p-5 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">Thêm Sản Phẩm Mới</h2>
          <button
            onClick={onClose}
            type="button"
            className="p-1 hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-4">
          {submitError && (
            <div className="p-3 bg-red-50 text-red-600 text-sm border border-red-200">
              {submitError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Tên sản phẩm <span className="text-red-500">*</span></label>
            <input
              {...register("name")}
              type="text"
              className="w-full p-2.5 border border-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
              placeholder="VD: Co 90 uPVC"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Quy cách</label>
            <input
              {...register("spec")}
              type="text"
              className="w-full p-2.5 border border-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
              placeholder="VD: Ø21"
            />
            {errors.spec && <p className="text-red-500 text-xs mt-1">{errors.spec.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Đơn vị <span className="text-red-500">*</span></label>
            <input
              {...register("unit")}
              type="text"
              className="w-full p-2.5 border border-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
              placeholder="VD: Cái, Mét, Cuộn"
            />
            {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Giá bán <span className="text-red-500">*</span></label>
            <input
              {...register("priceSell", { valueAsNumber: true })}
              type="number"
              className="w-full p-2.5 border border-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
              placeholder="VD: 1200000"
            />
            {errors.priceSell && <p className="text-red-500 text-xs mt-1">{errors.priceSell.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Hình ảnh</label>
            <div className="relative border border-dashed h-32 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer overflow-hidden bg-slate-50/50">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-2" />
              ) : (
                <>
                  <Upload size={24} className="text-slate-400" />
                  <span className="text-sm text-slate-500">
                    Nhấn để tải ảnh lên
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const imageFile = e.target.files[0];
                    
                    // Nén ảnh nếu file lớn hơn 1MB
                    if (imageFile.size > 1024 * 1024) {
                      setIsCompressing(true);
                      try {
                        const options = {
                          maxSizeMB: 1,
                          maxWidthOrHeight: 1920,
                          useWebWorker: true
                        };
                        const compressedFile = await imageCompression(imageFile, options);
                        setSelectedFile(compressedFile);
                      } catch (error) {
                        console.error("Compression error:", error);
                        setSelectedFile(imageFile);
                      } finally {
                        setIsCompressing(false);
                      }
                    } else {
                      setSelectedFile(imageFile);
                    }
                  } else {
                    setSelectedFile(null);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title=""
              />
            </div>
            {selectedFile && (
              <div className="flex justify-between items-center mt-2 px-1">
                <span className="text-xs text-slate-500 truncate max-w-[200px]">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedFile(null);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Xóa ảnh
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || isCompressing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {mutation.isPending || isCompressing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <Plus size={18} />
                  Thêm mới
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
