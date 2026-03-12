"use client";

import { useState, useEffect } from "react";
import { useCreateCategory } from "@/hooks/useCategories";
import { X, Upload, Plus } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Zod Schema Definition
const categorySchema = z.object({
  title: z.string().min(1, { message: "Tên danh mục không được bỏ trống" }),
  slug: z.string().min(1, { message: "Đường dẫn không được bỏ trống" }),
  shortTitle: z.string().min(1, { message: "Tên rút gọn không được bỏ trống" }),
  image: z.any().optional(), // File handling is often tricky with rigid schemas, we use any for now and handle upload in submit
  layout: z.enum(["table", "gallery"]),
  filterField: z.enum(["null", "name", "spec"]).nullable(),
  visibleFields: z.array(z.string()),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "")
    .replace(/(\s+)/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export function CategoryFormModal({ isOpen, onClose }: CategoryFormModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [shortTitleEdited, setShortTitleEdited] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      title: "",
      slug: "",
      shortTitle: "",
      layout: "table",
      filterField: "null",
      visibleFields: ["name", "priceSell"],
    },
  });

  const watchTitle = watch("title");
  const watchLayout = watch("layout");
  const watchVisibleFields = watch("visibleFields");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        title: "",
        slug: "",
        shortTitle: "",
        layout: "table",
        filterField: "null",
        visibleFields: ["name", "priceSell", "spec"], // mặc định có 2 thằng bắt buộc và spec
      });
      setShortTitleEdited(false);
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

  // Handle title change to sync slug and shortTitle
  useEffect(() => {
    if (watchTitle) {
      setValue("slug", generateSlug(watchTitle), { shouldValidate: true });
      if (!shortTitleEdited) {
        setValue("shortTitle", watchTitle, { shouldValidate: true });
      }
    } else {
      setValue("slug", "");
      if (!shortTitleEdited) {
        setValue("shortTitle", "");
      }
    }
  }, [watchTitle, setValue, shortTitleEdited]);

  const mutation = useCreateCategory();

  const onSubmit = (data: CategoryFormValues) => {
    setSubmitError(null);
    const formData = new FormData();

    formData.append("title", data.title);
    formData.append("slug", data.slug);
    formData.append("shortTitle", data.shortTitle);
    formData.append("layout", data.layout);

    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    if (data.layout === "table") {
      formData.append("filterField", data.filterField === "null" ? "" : (data.filterField || ""));
      data.visibleFields.forEach(field => formData.append("visibleFields", field));
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

  const handleVisibleFieldChange = (field: string, isChecked: boolean) => {
    const currentFields = watchVisibleFields || [];
    if (isChecked) {
      setValue("visibleFields", [...currentFields, field]);
    } else {
      setValue("visibleFields", currentFields.filter((f) => f !== field));
    }
  };

  if (!isOpen) return null;

  const isSpecVisible = (watchVisibleFields || []).includes("spec");
  const isUnitVisible = (watchVisibleFields || []).includes("unit");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center p-5 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">Thêm Danh Mục Mới</h2>
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
            <label className="text-sm font-medium text-slate-700">Tên danh mục <span className="text-red-500">*</span></label>
            <input
              {...register("title")}
              type="text"
              className="w-full p-2.5 border border-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
              placeholder="VD: Phụ kiện ống nước uPVC"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Đường dẫn (Slug)</label>
            <input
              {...register("slug")}
              readOnly
              type="text"
              className="w-full p-2.5 border border-gray-400 bg-slate-50 focus:ring-0 outline-none transition-shadow text-slate-500 text-sm cursor-not-allowed"
              placeholder="Sẽ tạo tự động từ tên bài viết"
            />
            {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Tên rút gọn (Hiển thị lưới) <span className="text-red-500">*</span></label>
            <input
              {...register("shortTitle")}
              onChange={(e) => {
                setShortTitleEdited(true);
                setValue("shortTitle", e.target.value, { shouldValidate: true });
              }}
              type="text"
              className="w-full p-2.5 border border-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
              placeholder="VD: uPVC Đạt Hoà"
            />
            {errors.shortTitle && <p className="text-red-500 text-xs mt-1">{errors.shortTitle.message}</p>}
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
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setSelectedFile(e.target.files[0]);
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Giao diện</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  {...register("layout")}
                  value="table"
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Bảng dữ liệu</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  {...register("layout")}
                  value="gallery"
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Thư viện ảnh</span>
              </label>
            </div>
            {errors.layout && <p className="text-red-500 text-xs mt-1">{errors.layout.message}</p>}
          </div>

          {watchLayout === 'table' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Trường lọc</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      {...register("filterField")}
                      value="null"
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700">Không lọc</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      {...register("filterField")}
                      value="name"
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700">Tên sản phẩm</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      {...register("filterField")}
                      value="spec"
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700">Quy cách</span>
                  </label>
                </div>
                {errors.filterField && <p className="text-red-500 text-xs mt-1">{errors.filterField.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Các cột hiển thị</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-not-allowed opacity-70">
                    <input
                      type="checkbox"
                      checked
                      readOnly
                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700">Tên sản phẩm</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer relative">
                    <input
                      type="checkbox"
                      checked={isSpecVisible}
                      onChange={(e) => handleVisibleFieldChange("spec", e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700">Quy cách</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer relative">
                    <input
                      type="checkbox"
                      checked={isUnitVisible}
                      onChange={(e) => handleVisibleFieldChange("unit", e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700">Đơn vị</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-not-allowed opacity-70">
                    <input
                      type="checkbox"
                      checked
                      readOnly
                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700">Giá bán</span>
                  </label>
                </div>
                {errors.visibleFields && <p className="text-red-500 text-xs mt-1">{errors.visibleFields.message}</p>}
              </div>
            </>
          )}

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
              disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? (
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
