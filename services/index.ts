import { ProductService } from './ProductService';
import { CategoryService } from './CategoryService';
import { InvoiceService } from './InvoiceService';
import { CustomerService } from './CustomerService';
import { SepayService } from './SepayService';

export const productService = ProductService.getInstance();
export const categoryService = CategoryService.getInstance();
export const invoiceService = InvoiceService.getInstance();
export const customerService = CustomerService.getInstance();
export const sepayService = SepayService.getInstance();

export { ProductService, CategoryService, InvoiceService, CustomerService, SepayService };
