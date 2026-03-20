"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { useSkeleton } from "@/components/providers/skeleton-provider";
import { X, Upload, Plus, Save, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import imageCompression from "browser-image-compression";
import type { Product } from "@/types/types";

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

const parseVND = (value: string) => {
  if (!value) return 0;
  return parseInt(value.replace(/[^0-9]/g, '')) || 0;
};

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  initialData?: Product | null;
  showImageField?: boolean;
}

export function ProductFormModal({
  isOpen,
  onClose,
  categoryId,
  initialData,
  showImageField = true
}: ProductFormModalProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setPendingProductCategoryId, startRefresh } = useSkeleton();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      spec: "",
      unit: "",
      priceSell: "" as any,
    },
  });

  const isEdit = !!initialData;

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          spec: initialData.spec || "",
          unit: initialData.unit || "",
          priceSell: parseVND(initialData.priceSell),
        });
        setPreviewUrl(initialData.image?.secure_url || null);
      } else {
        reset({
          name: "",
          spec: "",
          unit: "",
          priceSell: "" as any,
        });
        setPreviewUrl(null);
      }
      setSubmitError(null);
      setSelectedFile(null);
    }
  }, [isOpen, reset, initialData]);

  // Handle object url memory cleanup
  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [selectedFile]);

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

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

    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData._id, formData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["products", categoryId] });
          setPendingProductCategoryId(categoryId);
          startRefresh(() => {
            router.refresh();
            onClose();
          });
        },
        onError: (err: any) => {
          setSubmitError(err.message);
        }
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["products", categoryId] });
          setPendingProductCategoryId(categoryId);
          startRefresh(() => {
            router.refresh();
            onClose();
          });
        },
        onError: (err: any) => {
          setSubmitError(err.message);
        }
      });
    }
  };

  const handleDelete = () => {
    if (!initialData) return;
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      deleteMutation.mutate(initialData._id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["products", categoryId] });
          setPendingProductCategoryId(categoryId);
          startRefresh(() => {
            router.refresh();
            onClose();
          });
        },
        onError: (err: any) => {
          setSubmitError(err.message);
        }
      });
    }
  };

  // Reset pending state when modal closed
  useEffect(() => {
    if (!isOpen) {
      setPendingProductCategoryId(null);
    }
  }, [isOpen, setPendingProductCategoryId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center p-5 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">
            {isEdit ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
          </h2>
          <button
            onClick={onClose}
            type="button"
            disabled={isPending || isCompressing}
            className="p-1 hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={isPending || isCompressing}
              className="w-full p-2.5 border border-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow disabled:bg-slate-100 disabled:text-slate-500"
              placeholder="VD: Co 90 uPVC"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Quy cách</label>
            <input
              {...register("spec")}
              type="text"
              disabled={isPending || isCompressing}
              className="w-full p-2.5 border border-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow disabled:bg-slate-100 disabled:text-slate-500"
              placeholder="VD: Ø21"
            />
            {errors.spec && <p className="text-red-500 text-xs mt-1">{errors.spec.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Đơn vị <span className="text-red-500">*</span></label>
            <input
              {...register("unit")}
              type="text"
              disabled={isPending || isCompressing}
              className="w-full p-2.5 border border-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow disabled:bg-slate-100 disabled:text-slate-500"
              placeholder="VD: Cái, Mét, Cuộn"
            />
            {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Giá bán <span className="text-red-500">*</span></label>
            <input
              {...register("priceSell", { valueAsNumber: true })}
              type="number"
              disabled={isPending || isCompressing}
              className="w-full p-2.5 border border-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow disabled:bg-slate-100 disabled:text-slate-500"
              placeholder="VD: 1200000"
            />
            {errors.priceSell && <p className="text-red-500 text-xs mt-1">{errors.priceSell.message}</p>}
          </div>

          {showImageField && (
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
                  disabled={isPending || isCompressing}
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
                    disabled={isPending || isCompressing}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedFile(null);
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                  >
                    Xóa ảnh
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            {isEdit ? (
              <>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-70"
                >
                  <Trash2 size={18} />
                  Xóa
                </button>
                <button
                  type="submit"
                  disabled={isPending || isCompressing || !isValid}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isPending || isCompressing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      <Save size={18} />
                      Cập nhật
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={isPending || isCompressing || !isValid}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPending || isCompressing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <Plus size={18} />
                    Thêm mới
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
