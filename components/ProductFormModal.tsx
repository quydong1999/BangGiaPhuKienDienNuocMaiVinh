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
  specs: z.array(specSchema).min(1, { message: "Cần ít nhất 1 quy cách" }),
  images: z.any().optional(),
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

  interface ImagePreview {
    id: string;
    url: string;
    file?: File;
    public_id?: string;
    isRetained: boolean;
  }
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
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

        // Load initial images
        const initialImages = (initialData.images || []).map(img => ({
          id: img.secure_url || img.url || Math.random().toString(),
          url: img.secure_url || img.url || '',
          public_id: img.public_id,
          isRetained: true,
        }));
        // Hỗ trợ backwards compatibility (trước khi migration hoàn tất)
        if ((initialData as any).image && initialImages.length === 0) {
          const legacyImg = (initialData as any).image;
          initialImages.push({
            id: legacyImg.secure_url || legacyImg.url || Math.random().toString(),
            url: legacyImg.secure_url || legacyImg.url || '',
            public_id: legacyImg.public_id,
            isRetained: true,
          })
        }
        setImages(initialImages.slice(0, 10));
        setSelectedCategoryId(initialData.categoryId || categoryId);
      } else {
        reset({
          name: "",
          specs: [{ name: "", prices: [{ unit: "", price: 0 }] }]
        });
        setImages([]);
        setSelectedCategoryId(categoryId);
      }
      setSubmitError(null);
    }
  }, [isOpen, reset, initialData, categoryId]);

  // Cleanup object urls
  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (!img.isRetained && img.url) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [images]);

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

    // new images
    const newFiles = images.filter(img => !img.isRetained && img.file).map(img => img.file as File);
    for (const file of newFiles) {
      formData.append("images", file);
    }

    // retained image ids
    const retainedIds = images.filter(img => img.isRetained && img.public_id).map(img => img.public_id);
    formData.append("retainedImageIds", JSON.stringify(retainedIds));

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
    if (!e.target.files?.length) return;

    if (images.length + e.target.files.length > 10) {
      alert("Chỉ được tải lên tối đa 10 ảnh.");
      return;
    }

    setIsCompressing(true);
    try {
      const newPreviews: ImagePreview[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const imageFile = e.target.files[i];
        let processedFile = imageFile;
        if (imageFile.size > 1024 * 1024) {
          try {
            processedFile = await imageCompression(imageFile, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true });
          } catch {
            processedFile = imageFile;
          }
        }
        newPreviews.push({
          id: URL.createObjectURL(processedFile),
          url: URL.createObjectURL(processedFile),
          file: processedFile,
          isRetained: false,
        });
      }
      setImages(prev => [...prev, ...newPreviews].slice(0, 10));
    } finally {
      setIsCompressing(false);
    }

    // reset input
    e.target.value = '';
  };

  const handleRemoveImage = (idToRemove: string) => {
    setImages(prev => prev.filter(img => img.id !== idToRemove));
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
            className="w-full p-2.5 border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-base transition-all disabled:bg-slate-100"
            placeholder="VD: Co 90 uPVC"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Specs Array */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-700">Cấu hình & Giá *</label>

          <div className="space-y-4">
            {specFields.map((spec, sIdx) => (
              <div
                key={spec.id}
                className="p-4 border border-slate-200 bg-slate-50/50 space-y-4 relative group"
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
                      className="w-full p-2 bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-base transition-all"
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

          <button
            type="button"
            onClick={() => appendSpec({ name: "", prices: [{ unit: "", price: 0 }] })}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 border-2 border-dashed border-emerald-300 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 font-bold text-xs transition-colors"
          >
            <Plus size={14} /> Thêm quy cách
          </button>
        </div>

        {/* Hình ảnh */}
        <div className="space-y-1 pt-2">
          <label className="text-sm font-bold text-slate-700">Hình ảnh (tối đa 10 ảnh)</label>
          {images.length > 0 ? (
            <div className="grid grid-cols-5 gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative aspect-square border border-slate-200 bg-white overflow-hidden group">
                  <img src={img.url} alt="Preview" className="w-full h-full object-contain p-1" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    className="absolute top-1.5 right-1.5 bg-red-500 shadow-md text-white rounded-full p-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <div className="relative border-2 border-dashed border-slate-200 aspect-square flex flex-col items-center justify-center gap-1 hover:bg-slate-50 transition-colors cursor-pointer bg-slate-50/50">
                  <Plus size={20} className="text-slate-400" />
                  <span className="text-[10px] text-slate-500 font-medium">Thêm ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple // cho phép chọn nhiều file
                    disabled={isPending || isCompressing}
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="relative border-2 border-dashed border-slate-200 h-32 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer overflow-hidden bg-slate-50/50">
              <Upload size={24} className="text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Kéo thả hoặc nhấn để tải nhiều ảnh</span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={isPending || isCompressing}
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          )}
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
                className="w-full p-2 bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-base"
              />
            </div>
            <div className="flex-1">
              <input
                {...register(`specs.${nestIndex}.prices.${kIdx}.price`, { valueAsNumber: true })}
                type="number"
                placeholder="Giá bán"
                className="w-full p-2 bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-base"
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