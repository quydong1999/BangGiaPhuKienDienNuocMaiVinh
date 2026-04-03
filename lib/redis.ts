import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Missing Upstash Redis environment variables');
}

/**
 * Redis Singleton để quản lý kết nối duy nhất đến Upstash Redis.
 */
class RedisService {
  private static instance: Redis;

  private constructor() { }

  public static getInstance(): Redis {
    if (!RedisService.instance) {
      RedisService.instance = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
    }
    return RedisService.instance;
  }
}

export const redis = RedisService.getInstance();

/**
 * Cache keys constants
 */
export const CACHE_KEYS = {
  CATEGORIES_ALL: 'categories:all',
  CATEGORY_BY_SLUG: (slug: string) => `category:${slug}`,
  PRODUCTS_BY_CATEGORY: (categoryId: string) => `products:category:${categoryId}`,
  PRODUCTS_ALL: 'products:all',
  SEARCH_QUERY: (query: string) => `search:${query}`,
  CUSTOMERS_ALL: 'customers:all',
  INVOICES_ALL: 'invoices:all',
};

/**
 * Default TTL for cache (1 hour)
 */
export const DEFAULT_TTL = 3600;
