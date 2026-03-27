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

const fetchCategory = async (slug: string): Promise<Category> => {
  const response = await fetch(`/api/categories/${slug}`);
  if (!response.ok) {
    if (response.status === 404) {
       throw new Error('Category not found');
    }
    throw new Error('Network response was not ok');
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error('Failed to fetch category');
  }
  return result.data;
};

export function useCategory(slug: string) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: () => fetchCategory(slug),
    enabled: !!slug, // Only run the query if slug is available
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

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, formData }: { slug: string; formData: FormData }) => {
      const response = await fetch(`/api/categories/${slug}`, {
        method: "PATCH",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Có lỗi xảy ra khi cập nhật danh mục");
      }
      return result;
    },
    onMutate: async ({ slug, formData }) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });
      await queryClient.cancelQueries({ queryKey: ["category", slug] });
      
      const previousCategories = queryClient.getQueryData(["categories"]);
      const previousCategory = queryClient.getQueryData(["category", slug]);

      const title = formData.get('title') as string;
      const shortTitle = formData.get('shortTitle') as string;

      queryClient.setQueryData(["categories"], (old: any) => {
        if (Array.isArray(old)) {
          return old.map((c: any) => c.slug === slug ? { ...c, title, shortTitle } : c);
        }
        return old;
      });

      queryClient.setQueryData(["category", slug], (old: any) => {
        if (old) return { ...old, title, shortTitle };
        return old;
      });

      return { previousCategories, previousCategory };
    },
    onError: (_err, variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories"], context.previousCategories);
      }
      if (context?.previousCategory) {
        queryClient.setQueryData(["category", variables.slug], context.previousCategory);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", variables.slug] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const response = await fetch(`/api/categories/${slug}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Có lỗi xảy ra khi xóa danh mục");
      }
      return result;
    },
    onMutate: async (slug) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });
      const previousCategories = queryClient.getQueryData(["categories"]);

      queryClient.setQueryData(["categories"], (old: any) => {
        if (Array.isArray(old)) return old.filter((c: any) => c.slug !== slug);
        return old;
      });

      return { previousCategories };
    },
    onError: (_err, _slug, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories"], context.previousCategories);
      }
    },
    onSettled: (_, __, slug) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", slug] });
    },
  });
}

