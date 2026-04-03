import { connectDB } from '@/lib/mongodb';
import { redis, CACHE_KEYS, DEFAULT_TTL } from '@/lib/redis';
import Customer from '@/models/Customer';

export class CustomerService {
  private static instance: CustomerService;

  private constructor() { }

  public static getInstance(): CustomerService {
    if (!CustomerService.instance) {
      CustomerService.instance = new CustomerService();
    }
    return CustomerService.instance;
  }

  async findAll() {
    const cached = await redis.get(CACHE_KEYS.CUSTOMERS_ALL);
    if (cached) return cached;

    await connectDB();
    const customers = await Customer.find().sort({ name: 1 }).lean();
    await redis.set(CACHE_KEYS.CUSTOMERS_ALL, customers, { ex: DEFAULT_TTL });
    return customers;
  }

  async create(data: { name: string, phone?: string, address?: string, notes?: string }) {
    await connectDB();
    const customer = await Customer.findOneAndUpdate(
      { name: data.name },
      { $set: data },
      { upsert: true, new: true }
    );
    await redis.del(CACHE_KEYS.CUSTOMERS_ALL);
    return customer;
  }

  async findByName(name: string) {
    await connectDB();
    return await Customer.findOne({ name }).lean();
  }
}

export const customerService = CustomerService.getInstance();
