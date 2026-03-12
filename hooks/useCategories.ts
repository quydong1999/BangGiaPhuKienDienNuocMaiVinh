import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Định nghĩa kiểu dữ liệu cho Category dựa trên Mongoose Model của bạn
export interface Category {
  _id: string;
  slug: string;
  title: string;
  shortTitle?: string;
  image?: {
    public_id?: string;
    url?: string;
    secure_url?: string;
  };
  layout?: 'table' | 'gallery';
  visibleFields?: string[];
  filterField?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoriesResponse {
  success: boolean;
  count: number;
  data: Category[];
}

const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch('/api/categories');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const result: CategoriesResponse = await response.json();
  if (!result.success) {
    throw new Error('Failed to fetch categories');
  }
  return result.data;
};

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/categories", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Có lỗi xảy ra khi tạo danh mục");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
