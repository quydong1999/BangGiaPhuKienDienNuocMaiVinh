import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product } from "@/types/types";

export interface ProductsResponse {
    success: boolean;
    count: number;
    data: Product[];
}

const fetchProducts = async (categoryId?: string): Promise<Product[]> => {
    const url = categoryId ? `/api/products?categoryId=${categoryId}` : '/api/products';
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const result: ProductsResponse = await response.json();
    if (!result.success) {
        throw new Error('Failed to fetch products');
    }
    return result.data;
};

export function useProducts(categoryId?: string, initialData?: Product[]) {
    return useQuery({
        queryKey: ['products', categoryId],
        queryFn: () => fetchProducts(categoryId),
        enabled: !!categoryId, // Only run the query if categoryId is available
        initialData,
    });
}

const fetchProduct = async (slug: string): Promise<Product> => {
    const response = await fetch(`/api/products/${slug}`);
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Product not found');
        }
        throw new Error('Network response was not ok');
    }
    const result = await response.json();
    if (!result.success) {
        throw new Error('Failed to fetch product');
    }
    return result.data;
};

export function useProduct(slug: string) {
    return useQuery({
        queryKey: ['product', slug],
        queryFn: () => fetchProduct(slug),
        enabled: !!slug, // Only run the query if slug is available
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await fetch("/api/products", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || result.error || "Có lỗi xảy ra khi tạo sản phẩm");
            }
            return result.data;
        },
        onMutate: async (formData) => {
            const categoryId = formData.get('categoryId') as string;
            
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["products"] });

            // Snapshot previous values
            const previousQueries = queryClient.getQueriesData({ queryKey: ["products"] });

            // Optimistically update to the new value
            const newProduct = {
                _id: 'temp-' + Date.now(),
                name: formData.get('name') as string,
                spec: formData.get('spec') as string,
                unit: formData.get('unit') as string,
                priceSell: formData.get('priceSell') as string,
                categoryId,
            };

            previousQueries.forEach(([queryKey]) => {
                const queryCategoryId = queryKey[1] as string | undefined;
                if (queryCategoryId === undefined || queryCategoryId === categoryId) {
                    queryClient.setQueryData(queryKey, (old: any) => {
                        if (Array.isArray(old)) return [...old, newProduct];
                        return [newProduct];
                    });
                }
            });

            return { previousQueries };
        },
        onError: (_err, _formData, context) => {
            if (context?.previousQueries) {
                context.previousQueries.forEach(([queryKey, queryData]) => {
                    queryClient.setQueryData(queryKey, queryData);
                });
            }
        },
        onSettled: (_data, _error, formData) => {
            const categoryId = formData.get('categoryId') as string;
            queryClient.invalidateQueries({ queryKey: ["products", categoryId] });
            queryClient.invalidateQueries({ queryKey: ["products", undefined] });
        },
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, formData }: { id: string, formData: FormData }) => {
            const response = await fetch(`/api/products/${id}`, {
                method: "PATCH",
                body: formData,
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || result.error || "Có lỗi xảy ra khi cập nhật sản phẩm");
            }
            return result.data;
        },
        onMutate: async ({ id, formData }) => {
            await queryClient.cancelQueries({ queryKey: ["products"] });
            const previousQueries = queryClient.getQueriesData({ queryKey: ["products"] });

            const updatedFields = {
                name: formData.get('name') as string,
                spec: formData.get('spec') as string,
                unit: formData.get('unit') as string,
                priceSell: formData.get('priceSell') as string,
                categoryId: formData.get('categoryId') as string,
            };

            // Tìm sản phẩm gốc để có đầy đủ thông tin khi thêm vào cache của danh mục mới
            let originalProduct: any = null;
            for (const [, data] of previousQueries) {
                if (Array.isArray(data)) {
                    originalProduct = data.find(p => p._id === id);
                    if (originalProduct) break;
                }
            }

            previousQueries.forEach(([queryKey]) => {
                const queryCategoryId = queryKey[1] as string | undefined;

                queryClient.setQueryData(queryKey, (old: any) => {
                    if (!Array.isArray(old)) return old;

                    const isCurrentlyInThisList = old.some(p => p._id === id);
                    const shouldBeInThisList = (queryCategoryId === undefined) || (queryCategoryId === updatedFields.categoryId);

                    // 1. Nếu đang có trong list này nhưng không thuộc category này nữa -> Xóa
                    if (isCurrentlyInThisList && !shouldBeInThisList) {
                        return old.filter(p => p._id !== id);
                    }
                    
                    // 2. Nếu đang có và vẫn thuộc category này -> Cập nhật
                    if (isCurrentlyInThisList && shouldBeInThisList) {
                        return old.map(p => p._id === id ? { ...p, ...updatedFields } : p);
                    }

                    // 3. Nếu chưa có nhưng vừa được chuyển vào category này -> Thêm
                    if (!isCurrentlyInThisList && shouldBeInThisList && originalProduct) {
                        return [...old, { ...originalProduct, ...updatedFields }];
                    }

                    return old;
                });
            });

            return { previousQueries };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousQueries) {
                context.previousQueries.forEach(([queryKey, queryData]) => {
                    queryClient.setQueryData(queryKey, queryData);
                });
            }
        },
        onSettled: (data) => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            if (data?._id) {
                queryClient.invalidateQueries({ queryKey: ["product", data._id] });
            }
        },
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/products/${id}`, {
                method: "DELETE",
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || result.error || "Có lỗi xảy ra khi xóa sản phẩm");
            }
            return result;
        },
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: ["products"] });
            const previousQueries = queryClient.getQueriesData({ queryKey: ["products"] });

            queryClient.setQueriesData({ queryKey: ["products"] }, (old: any) => {
                if (Array.isArray(old)) {
                    return old.filter((p: any) => p._id !== id);
                }
                return old;
            });

            return { previousQueries };
        },
        onError: (_err, _id, context) => {
            if (context?.previousQueries) {
                context.previousQueries.forEach(([queryKey, queryData]) => {
                    queryClient.setQueryData(queryKey, queryData);
                });
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });
}
