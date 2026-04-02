"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCreateCategory, useUpdateCategory, useDeleteCategory, useCategories } from "@/hooks/useCategories";
import { useSkeleton } from "@/components/providers/skeleton-provider";
import { Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import imageCompression from "browser-image-compression";
import { FormModal } from "@/components/FormModal";

const baseCategorySchema = z.object({
  title: z.string().min(1, { message: "Tên danh mục không được bỏ trống" }),
  slug: z.string().min(1, { message: "Đường dẫn không được bỏ trống" }),
  shortTitle: z.string().min(1, { message: "Tên rút gọn không được bỏ trống" }),
  image: z.any().optional(),
  layout: z.enum(["table", "gallery"]),
  filterField: z.enum(["null", "name", "spec"]).nullable(),
  visibleFields: z.array(z.string()),
});

type CategoryFormValues = z.infer<typeof baseCategorySchema>;

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  productCount?: number;
}

const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "")
    .replace(/(\s+)/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

export function CategoryFormModal({ isOpen, onClose, initialData, productCount }: CategoryFormModalProps) {
  const router = useRouter();
  const { setIsAddingCategory, startRefresh } = useSkeleton();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [shortTitleEdited, setShortTitleEdited] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isEdit = !!initialData;

  const { data: existingCategories } = useCategories();
  const existingSlugs = useMemo(
    () => (existingCategories ? existingCategories.map((c: any) => c.slug) : []),
    [existingCategories]
  );

  const schema = useMemo(
    () =>
      baseCategorySchema.extend({
        slug: z.string().min(1, { message: "Đường dẫn không được bỏ trống" }).refine(
          (val) => {
            if (isEdit && initialData?.slug === val) return true;
            return !existingSlugs.includes(val);
          },
          { message: "Đường dẫn (Slug) này đã tồn tại" }
        ),
      }),
    [existingSlugs, isEdit, initialData?.slug]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
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

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          title: initialData.title,
          slug: initialData.slug,
          shortTitle: initialData.shortTitle,
          layout: initialData.layout || "table",
          filterField: initialData.filterField || "null",
          visibleFields: initialData.visibleFields || ["name", "priceSell", "spec"],
        });
        setPreviewUrl(initialData.image?.secure_url || null);
        setShortTitleEdited(true);
      } else {
        reset({
          title: "",
          slug: "",
          shortTitle: "",
          layout: "table",
          filterField: "null",
          visibleFields: ["name", "priceSell", "spec"],
        });
        setPreviewUrl(null);
        setShortTitleEdited(false);
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
    } else if (!initialData) {
      // Only clear preview if we are NOT editing
      setPreviewUrl(null);
    }
  }, [selectedFile, initialData]);

  useEffect(() => {
    // Always auto-generate slug from title (both create and edit modes)
    // Slug field is read-only, so it must always reflect the title
    if (watchTitle) {
      setValue("slug", generateSlug(watchTitle), { shouldValidate: true });
      // Only auto-generate shortTitle in create mode
      if (!initialData && !shortTitleEdited) setValue("shortTitle", watchTitle, { shouldValidate: true });
    } else {
      setValue("slug", "");
      if (!initialData && !shortTitleEdited) setValue("shortTitle", "");
    }
  }, [watchTitle, setValue, shortTitleEdited, initialData]);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const onSubmit = (data: CategoryFormValues) => {
    setSubmitError(null);
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("slug", data.slug);
    formData.append("shortTitle", data.shortTitle);
    formData.append("layout", data.layout);
    if (selectedFile) formData.append("image", selectedFile);
    formData.append("filterField", data.filterField === "null" ? "" : data.filterField || "");
    if (data.layout === "table") {
      
      // Ensure fixed fields are always included, even if missing from initialData
      const finalVisibleFields = Array.from(new Set([...data.visibleFields, "name", "priceSell"]));
      finalVisibleFields.forEach((field) => formData.append("visibleFields", field));
    }

    const mutationOptions = {
      onSuccess: () => {
        if (!isEdit) {
          setIsAddingCategory(true);
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
      updateMutation.mutate({ slug: initialData.slug, formData }, mutationOptions);
    } else {
      createMutation.mutate(formData, mutationOptions);
    }
  };

  const handleDelete = () => {
    if (!initialData || (productCount && productCount > 0)) return;
    if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      deleteMutation.mutate(initialData.slug, {
        onSuccess: () => {
          // Không hiện skeleton khi xóa
          router.refresh();
          onClose();
        },
        onError: (err: any) => setSubmitError(err.message),
      });
    }
  };

  useEffect(() => {
    if (!isOpen) setIsAddingCategory(false);
  }, [isOpen, setIsAddingCategory]);

  const handleVisibleFieldChange = (field: string, isChecked: boolean) => {
    const currentFields = watchVisibleFields || [];
    setValue(
      "visibleFields",
      isChecked ? [...currentFields, field] : currentFields.filter((f) => f !== field)
    );
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

  const isSpecVisible = (watchVisibleFields || []).includes("spec");
  const isUnitVisible = (watchVisibleFields || []).includes("unit");

  return (
    <FormModal isOpen={isOpen} onClose={onClose} isPending={isPending} isCompressing={isCompressing}>
      <FormModal.Header
        title={isEdit ? "Chỉnh Sửa Danh Mục" : "Thêm Danh Mục Mới"}
        onClose={onClose}
        disabled={isPending || isCompressing}
      />

      <FormModal.Body onSubmit={handleSubmit(onSubmit)} submitError={submitError}>
        {/* Tên danh mục */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Tên danh mục <span className="text-red-500">*</span>
          </label>
          <input
            {...register("title")}
            type="text"
            disabled={isPending || isCompressing}
            className="w-full p-2.5 border border-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none text-base transition-shadow disabled:bg-slate-100 disabled:text-slate-500"
            placeholder="VD: Phụ kiện ống nước uPVC"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        {/* Slug */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Đường dẫn (Slug)</label>
          <input
            {...register("slug")}
            readOnly
            type="text"
            className="w-full p-2.5 border border-gray-400 bg-slate-50 outline-none text-slate-500 text-base cursor-not-allowed"
            placeholder="Sẽ tạo tự động từ tên bài viết"
          />
          {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
        </div>

        {/* Tên rút gọn */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Tên rút gọn (Hiển thị lưới) <span className="text-red-500">*</span>
          </label>
          <input
            {...register("shortTitle")}
            disabled={isPending || isCompressing}
            onChange={(e) => { setShortTitleEdited(true); setValue("shortTitle", e.target.value, { shouldValidate: true }); }}
            type="text"
            className="w-full p-2.5 border border-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none text-base transition-shadow disabled:bg-slate-100 disabled:text-slate-500"
            placeholder="VD: uPVC Đạt Hoà"
          />
          {errors.shortTitle && <p className="text-red-500 text-xs mt-1">{errors.shortTitle.message}</p>}
        </div>

        {/* Hình ảnh */}
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

        {/* Layout */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Giao diện</label>
          <div className="flex gap-4">
            {(["table", "gallery"] as const).map((val) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  {...register("layout")}
                  disabled={isPending || isCompressing}
                  value={val}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                />
                <span className="text-sm text-slate-700">{val === "table" ? "Bảng dữ liệu" : "Thư viện ảnh"}</span>
              </label>
            ))}
          </div>
          {errors.layout && <p className="text-red-500 text-xs mt-1">{errors.layout.message}</p>}
        </div>

        {/* Trường lọc (áp dụng cả Table và Gallery) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Trường lọc</label>
          <div className="flex gap-4">
            {([
              { value: "null", label: "Không lọc" },
              { value: "name", label: "Tên sản phẩm" },
              { value: "spec", label: "Quy cách" },
            ] as const).map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  {...register("filterField")}
                  disabled={isPending || isCompressing}
                  value={value}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>
          {errors.filterField && <p className="text-red-500 text-xs mt-1">{errors.filterField.message}</p>}
        </div>

        {/* Table-only fields */}
        {watchLayout === "table" && (
          <>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Các cột hiển thị</label>
              <div className="flex flex-col gap-2">
                {/* Fixed fields */}
                {["Tên sản phẩm", "Giá bán"].map((label) => (
                  <label key={label} className="flex items-center gap-2 cursor-not-allowed opacity-70">
                    <input type="checkbox" checked readOnly className="w-4 h-4 text-emerald-600 border-slate-300" />
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                ))}
                {/* Toggleable fields */}
                {([
                  { field: "spec", label: "Quy cách", checked: isSpecVisible },
                  { field: "unit", label: "Đơn vị", checked: isUnitVisible },
                ] as const).map(({ field, label, checked }) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isPending || isCompressing}
                      onChange={(e) => handleVisibleFieldChange(field, e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 disabled:opacity-50"
                    />
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Actions phải nằm trong <form> để type="submit" hoạt động */}
        <FormModal.Actions
          mode={isEdit ? "edit" : "create"}
          isPending={isPending}
          isCompressing={isCompressing}
          isValid={isValid}
          onDelete={handleDelete}
          deleteDisabled={!!productCount && productCount > 0}
          deleteTooltip={`Không thể xóa vì danh mục đang có ${productCount} sản phẩm`}
        />
      </FormModal.Body>
    </FormModal>
  );
}