import { ProductService } from './ProductService';
import { CategoryService } from './CategoryService';

export const productService = ProductService.getInstance();
export const categoryService = CategoryService.getInstance();

export { ProductService, CategoryService };
