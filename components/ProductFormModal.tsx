"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { useSkeleton } from "@/components/providers/skeleton-provider";
import { Upload, Plus, Trash2, ChevronRight, Package } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import imageCompression from "browser-image-compression";
import type { Product } from "@/types/types";
import { FormModal } from "@/components/FormModal";
import { CategorySelect } from "@/components/CategorySelect";
import { cn } from "@/lib/utils";

const priceSchema = z.object({
  unit: z.string().min(1, { message: "Đơn vị không được bỏ trống" }),
  price: z.number().min(0, { message: "Giá không hợp lệ" }),
});

const specSchema = z.object({
  name: z.string(),
  prices: z.array(priceSchema).min(1, { message: "Cần ít nhất 1 mức giá" }),
});

const productSchema = z.object({
  name: z.string().min(1, { message: "Tên sản phẩm không được bỏ trống" }),
  specs: z.array(specSchema).min(1, { message: "Cần ít nhất 1 cấu hình" }),
  image: z.any().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  initialData?: Product | null;
}

export function ProductFormModal({
  isOpen,
  onClose,
  categoryId,
  initialData,
}: ProductFormModalProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setPendingProductCategoryId, startRefresh } = useSkeleton();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categoryId);

  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    mode: "onChange",
    defaultValues: { 
      name: "", 
      specs: [{ name: "", prices: [{ unit: "", price: 0 }] }] 
    },
  });

  const { fields: specFields, append: appendSpec, remove: removeSpec } = useFieldArray({
    control,
    name: "specs",
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          specs: initialData.specs.length > 0 
            ? initialData.specs 
            : [{ name: "", prices: [{ unit: "", price: 0 }] }],
        });
        setPreviewUrl(initialData.image?.secure_url || null);
        setSelectedCategoryId(initialData.categoryId || categoryId);
      } else {
        reset({ 
          name: "", 
          specs: [{ name: "", prices: [{ unit: "", price: 0 }] }] 
        });
        setPreviewUrl(null);
        setSelectedCategoryId(categoryId);
      }
      setSubmitError(null);
      setSelectedFile(null);
    }
  }, [isOpen, reset, initialData, categoryId]);

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
    formData.append("categoryId", selectedCategoryId);
    formData.append("specs", JSON.stringify(data.specs));
    
    if (selectedFile) formData.append("image", selectedFile);

    const mutationOptions = {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        if (!isEdit) {
          setPendingProductCategoryId(selectedCategoryId);
          startRefresh(() => {
            router.refresh();
            onClose();
          });
        } else {
          router.refresh();
          onClose();
        }
      },
      onError: (err: any) => setSubmitError(err.message),
    };

    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData._id, formData }, mutationOptions);
    } else {
      createMutation.mutate(formData, mutationOptions);
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
        {/* Danh mục */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-700">Danh mục *</label>
          <CategorySelect
            value={selectedCategoryId}
            onChange={setSelectedCategoryId}
            disabled={isPending || isCompressing}
          />
        </div>

        {/* Tên sản phẩm */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-700">Tên sản phẩm *</label>
          <input
            {...register("name")}
            type="text"
            disabled={isPending || isCompressing}
            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all disabled:bg-slate-100"
            placeholder="VD: Co 90 uPVC"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Specs Array */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-700">Cấu hình & Giá *</label>
            <button
              type="button"
              onClick={() => appendSpec({ name: "", prices: [{ unit: "", price: 0 }] })}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition-colors"
            >
              <Plus size={14} /> Thêm cấu hình
            </button>
          </div>

          <div className="space-y-4">
            {specFields.map((spec, sIdx) => (
              <div 
                key={spec.id} 
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4 relative group"
              >
                {specFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSpec(sIdx)}
                    className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tên Quy cách (Tùy chọn)</span>
                    <input
                      {...register(`specs.${sIdx}.name`)}
                      placeholder="VD: Ø21, Loại 1..."
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all"
                    />
                  </div>

                  {/* Prices Array nested in Spec */}
                  <PriceFieldArray 
                    nestIndex={sIdx} 
                    control={control} 
                    register={register} 
                    errors={errors} 
                    disabled={isPending}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hình ảnh */}
        <div className="space-y-1 pt-2">
          <label className="text-sm font-bold text-slate-700">Hình ảnh</label>
            <div className="relative border-2 border-dashed border-slate-200 rounded-xl h-32 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer overflow-hidden bg-slate-50/50">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-2" />
              ) : (
                <>
                  <Upload size={24} className="text-slate-400" />
                  <span className="text-xs text-slate-500 font-medium">Kéo thả hoặc nhấn để tải ảnh</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={isPending || isCompressing}
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

        <FormModal.Actions
          mode={isEdit ? "edit" : "create"}
          isPending={isPending}
          isCompressing={isCompressing}
          isValid={isValid}
          onDelete={() => {
              if (window.confirm("Xóa sản phẩm này?")) {
                  deleteMutation.mutate(initialData!._id, {
                      onSuccess: () => { onClose(); router.refresh(); }
                  });
              }
          }}
        />
      </FormModal.Body>
    </FormModal>
  );
}

// Sub-component for nested prices
function PriceFieldArray({ nestIndex, control, register, errors, disabled }: any) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `specs.${nestIndex}.prices`,
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đơn vị & Giá *</span>
        <button
          type="button"
          onClick={() => append({ unit: "", price: 0 })}
          className="text-[10px] flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700"
        >
          <Plus size={12} /> Thêm đơn vị
        </button>
      </div>

      <div className="space-y-2">
        {fields.map((field, kIdx) => (
          <div key={field.id} className="flex gap-2 items-start">
            <div className="flex-1">
              <input
                {...register(`specs.${nestIndex}.prices.${kIdx}.unit`)}
                placeholder="Đơn vị (VD: Cái)"
                className="w-full p-2 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
              />
            </div>
            <div className="flex-1">
              <input
                {...register(`specs.${nestIndex}.prices.${kIdx}.price`, { valueAsNumber: true })}
                type="number"
                placeholder="Giá bán"
                className="w-full p-2 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
              />
            </div>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(kIdx)}
                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                title="Xóa giá này"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      {errors.specs?.[nestIndex]?.prices && (
          <p className="text-red-500 text-[10px] mt-1">{errors.specs[nestIndex].prices.message}</p>
      )}
    </div>
  );
}