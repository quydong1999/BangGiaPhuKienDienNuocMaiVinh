import { connectDB } from '@/lib/mongodb';
import { redis, CACHE_KEYS, DEFAULT_TTL } from '@/lib/redis';
import Invoice from '@/models/Invoice';
import { customerService } from './CustomerService';

export class InvoiceService {
  private static instance: InvoiceService;

  private constructor() { }

  public static getInstance(): InvoiceService {
    if (!InvoiceService.instance) {
      InvoiceService.instance = new InvoiceService();
    }
    return InvoiceService.instance;
  }

  async create(data: any) {
    await connectDB();
    
    // 1. Ensure customer exists
    if (data.customerName && data.customerName !== 'Khách vãng lai') {
      await customerService.create({ name: data.customerName });
    }
    if (data.recipientName && data.recipientName !== 'Khách vãng lai' && data.recipientName !== data.customerName) {
      await customerService.create({ name: data.recipientName });
    }

    // 2. Prepare data (Strip _id or id to let MongoDB generate it)
    const { _id, id, ...invoiceFields } = data;
    const invoiceDate = new Date(invoiceFields.invoiceDate || Date.now());

    // 3. Handle paidAt logic
    if (invoiceFields.status === 'paid') {
      invoiceFields.paidAt = new Date();
    } else {
      invoiceFields.paidAt = null;
    }

    // 4. Create invoice
    const newInvoice = new Invoice({
      ...invoiceFields,
      invoiceDate
    });

    const savedInvoice = await newInvoice.save();
    await redis.del(CACHE_KEYS.INVOICES_ALL);
    return savedInvoice;
  }

  async findAll(query: any = {}) {
    await connectDB();
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.customerName) filter.customerName = { $regex: query.customerName, $options: 'i' };
    
    // Date range filter
    if (query.startDate || query.endDate) {
      filter.invoiceDate = {};
      if (query.startDate) filter.invoiceDate.$gte = new Date(query.startDate);
      if (query.endDate) filter.invoiceDate.$lte = new Date(query.endDate);
    }

    return await Invoice.find(filter).sort({ invoiceDate: -1, createdAt: -1 }).lean();
  }

  async findById(id: string) {
    await connectDB();
    return await Invoice.findById(id).lean();
  }

  async update(id: string, data: any) {
    await connectDB();

    // 1. If customer name or recipient changed, ensure they exist in Customer collection
    if (data.customerName && data.customerName !== 'Khách vãng lai') {
      await customerService.create({ name: data.customerName });
    }
    if (data.recipientName && data.recipientName !== 'Khách vãng lai' && data.recipientName !== data.customerName) {
      await customerService.create({ name: data.recipientName });
    }

    // 2. Handle paidAt logic
    if (data.status === 'paid') {
      // Use provided paidAt or default to now
      data.paidAt = data.paidAt ? new Date(data.paidAt) : new Date();
    } else if (data.status && data.status !== 'paid') {
      data.paidAt = null;
    }

    // 3. Perform the update
    const updated = await Invoice.findByIdAndUpdate(
      id, 
      { $set: data }, 
      { new: true }
    );

    await redis.del(CACHE_KEYS.INVOICES_ALL);
    return updated;
  }

  async delete(id: string) {
    await connectDB();
    const result = await Invoice.findByIdAndDelete(id);
    await redis.del(CACHE_KEYS.INVOICES_ALL);
    return result;
  }
}

export const invoiceService = InvoiceService.getInstance();
