import { ProductService } from './ProductService';
import { CategoryService } from './CategoryService';
import { InvoiceService } from './InvoiceService';
import { CustomerService } from './CustomerService';

export const productService = ProductService.getInstance();
export const categoryService = CategoryService.getInstance();
export const invoiceService = InvoiceService.getInstance();
export const customerService = CustomerService.getInstance();

export { ProductService, CategoryService, InvoiceService, CustomerService };
