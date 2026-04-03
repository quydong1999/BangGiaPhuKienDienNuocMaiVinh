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

  private async generateInvoiceNumber(date: Date): Promise<string> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await Invoice.countDocuments({
      invoiceDate: { $gte: startOfDay, $lte: endOfDay }
    });

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const sequence = String(count + 1).padStart(3, '0');

    return `MV-${year}${month}${day}-${sequence}`;
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

    // 2. Generate invoice number
    const invoiceDate = new Date(data.invoiceDate || Date.now());
    const invoiceNumber = await this.generateInvoiceNumber(invoiceDate);

    // 3. Handle paidAt logic
    if (data.status === 'paid') {
      data.paidAt = new Date();
    } else {
      data.paidAt = null;
    }

    // 4. Create invoice
    const newInvoice = new Invoice({
      ...data,
      invoiceNumber,
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
