"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { useSkeleton } from "@/components/providers/skeleton-provider";
import { Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import imageCompression from "browser-image-compression";
import type { Product } from "@/types/types";
import { FormModal } from "@/components/FormModal";

const productSchema = z.object({
  name: z.string().min(1, { message: "Tên sản phẩm không được bỏ trống" }),
  spec: z.string().optional(),
  unit: z.string().min(1, { message: "Đơn vị không được bỏ trống" }),
  priceSell: z.number().min(1, { message: "Giá bán không được bỏ trống" }),
  image: z.any().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const formatVND = (value: number) => new Intl.NumberFormat("vi-VN").format(value) + " đ";
const parseVND = (value: string) => (value ? parseInt(value.replace(/[^0-9]/g, "")) || 0 : 0);

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
  showImageField = true,
}: ProductFormModalProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setPendingProductCategoryId, startRefresh } = useSkeleton();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    mode: "onChange",
    defaultValues: { name: "", spec: "", unit: "", priceSell: "" as any },
  });

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
        reset({ name: "", spec: "", unit: "", priceSell: "" as any });
        setPreviewUrl(null);
      }
      setSubmitError(null);
      setSelectedFile(null);
    }
  }, [isOpen, reset, initialData]);

  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [selectedFile]);

  useEffect(() => {
    if (!isOpen) setPendingProductCategoryId(null);
  }, [isOpen, setPendingProductCategoryId]);

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
    if (selectedFile) formData.append("image", selectedFile);

    const mutationOptions = {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["products", categoryId] });
        setPendingProductCategoryId(categoryId);
        startRefresh(() => { router.refresh(); onClose(); });
      },
      onError: (err: any) => setSubmitError(err.message),
    };

    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData._id, formData }, mutationOptions);
    } else {
      createMutation.mutate(formData, mutationOptions);
    }
  };

  const handleDelete = () => {
    if (!initialData) return;
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      deleteMutation.mutate(initialData._id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["products", categoryId] });
          setPendingProductCategoryId(categoryId);
          startRefresh(() => { router.refresh(); onClose(); });
        },
        onError: (err: any) => setSubmitError(err.message),
      });
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return setSelectedFile(null);
    const imageFile = e.target.files[0];
    if (imageFile.size > 1024 * 1024) {
      setIsCompressing(true);
      try {
        const compressed = await imageCompression(imageFile, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true });
        setSelectedFile(compressed);
      } catch {
        setSelectedFile(imageFile);
      } finally {
        setIsCompressing(false);
      }
    } else {
      setSelectedFile(imageFile);
    }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} isPending={isPending} isCompressing={isCompressing}>
      <FormModal.Header
        title={isEdit ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
        onClose={onClose}
        disabled={isPending || isCompressing}
      />

      <FormModal.Body onSubmit={handleSubmit(onSubmit)} submitError={submitError}>
        {/* Tên sản phẩm */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Tên sản phẩm <span className="text-red-500">*</span>
          </label>
          <input
            {...register("name")}
            type="text"
            disabled={isPending || isCompressing}
            className="w-full p-2.5 border border-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow disabled:bg-slate-100 disabled:text-slate-500"
            placeholder="VD: Co 90 uPVC"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Quy cách */}
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

        {/* Đơn vị */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Đơn vị <span className="text-red-500">*</span>
          </label>
          <input
            {...register("unit")}
            type="text"
            disabled={isPending || isCompressing}
            className="w-full p-2.5 border border-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow disabled:bg-slate-100 disabled:text-slate-500"
            placeholder="VD: Cái, Mét, Cuộn"
          />
          {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit.message}</p>}
        </div>

        {/* Giá bán */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Giá bán <span className="text-red-500">*</span>
          </label>
          <input
            {...register("priceSell", { valueAsNumber: true })}
            type="number"
            disabled={isPending || isCompressing}
            className="w-full p-2.5 border border-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow disabled:bg-slate-100 disabled:text-slate-500"
            placeholder="VD: 1200000"
          />
          {errors.priceSell && <p className="text-red-500 text-xs mt-1">{errors.priceSell.message}</p>}
        </div>

        {/* Hình ảnh */}
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
                  <span className="text-sm text-slate-500">Nhấn để tải ảnh lên</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={isPending || isCompressing}
                onChange={handleImageChange}
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
                  onClick={() => setSelectedFile(null)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  Xóa ảnh
                </button>
              </div>
            )}
          </div>
        )}

        {/* Actions phải nằm trong <form> để type="submit" hoạt động */}
        <FormModal.Actions
          mode={isEdit ? "edit" : "create"}
          isPending={isPending}
          isCompressing={isCompressing}
          isValid={isValid}
          onDelete={handleDelete}
        />
      </FormModal.Body>
    </FormModal>
  );
}