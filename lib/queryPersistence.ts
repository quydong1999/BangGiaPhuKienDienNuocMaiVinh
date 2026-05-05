/**
 * Query Persistence Utility
 *
 * Quản lý việc đọc/ghi cache TanStack Query vào localStorage
 * để hỗ trợ pattern Stale-While-Revalidate khi mở lại app.
 *
 * Key format: qcache_{cacheKey}
 * Mỗi entry lưu kèm timestamp để kiểm tra maxAge.
 */

const CACHE_PREFIX = 'qcache_';

/** Thời gian cache mặc định: 24 giờ */
const DEFAULT_MAX_AGE = 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Ghi data vào localStorage kèm timestamp.
 */
export function persistQueryData<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage might be full or unavailable (e.g. private browsing)
  }
}

/**
 * Đọc cache từ localStorage.
 * Trả về { data, timestamp } nếu cache còn hợp lệ (chưa quá maxAge).
 * Trả về null nếu không có cache hoặc đã hết hạn.
 */
export function getPersistedQueryData<T>(
  key: string,
  maxAge: number = DEFAULT_MAX_AGE
): { data: T; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);

    // Kiểm tra cache có quá cũ không
    const age = Date.now() - entry.timestamp;
    if (age > maxAge) {
      // Xóa cache đã hết hạn
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return { data: entry.data, timestamp: entry.timestamp };
  } catch {
    return null;
  }
}

/**
 * Xóa cache theo key cụ thể.
 */
export function clearPersistedQueryData(key: string): void {
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch {
    // ignore
  }
}

/**
 * Xóa tất cả products cache (prefix match: qcache_products_*).
 * Dùng khi CRUD products vì mỗi categoryId có cache riêng.
 */
export function clearProductsCache(): void {
  try {
    const prefix = CACHE_PREFIX + 'products_';
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

/**
 * Xóa tất cả query cache trong localStorage.
 */
export function clearAllPersistedQueryData(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}
