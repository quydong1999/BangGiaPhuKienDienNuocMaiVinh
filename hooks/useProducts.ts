import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Định nghĩa kiểu dữ liệu cho Product dựa trên Mongoose Model của bạn
export interface Product {
    _id: string;
    name: string;
    spec?: string;
    unit?: string;
    image?: {
        public_id?: string;
        url?: string;
        secure_url?: string;
    };
    priceSell: string,
    categoryId: string;
    createdAt?: string;
    updatedAt?: string;
}

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

export function useProducts(categoryId?: string) {
    return useQuery({
        queryKey: ['products', categoryId],
        queryFn: () => fetchProducts(categoryId),
        enabled: !!categoryId, // Only run the query if categoryId is available
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
        onSuccess: () => {
            // Invalidate all product related queries
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });
}
