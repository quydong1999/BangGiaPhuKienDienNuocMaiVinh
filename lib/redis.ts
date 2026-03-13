import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Missing Upstash Redis environment variables');
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Cache keys constants
 */
export const CACHE_KEYS = {
  CATEGORIES_ALL: 'categories:all',
  CATEGORY_BY_SLUG: (slug: string) => `category:${slug}`,
  PRODUCTS_BY_CATEGORY: (categoryId: string) => `products:category:${categoryId}`,
  PRODUCTS_ALL: 'products:all',
  SEARCH_QUERY: (query: string) => `search:${query}`,
};

/**
 * Default TTL for cache (1 hour)
 */
export const DEFAULT_TTL = 3600;
