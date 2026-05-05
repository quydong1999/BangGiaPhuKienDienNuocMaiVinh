/**
 * usePersistentQuery
 *
 * Custom hook kết hợp TanStack Query + localStorage persistence.
 * Pattern: Stale-While-Revalidate
 *
 * 1. Khi mount: đọc localStorage → dùng làm initialData (hiển thị ngay, không skeleton)
 * 2. staleTime: 0 → TanStack Query luôn refetch ngầm
 * 3. Khi data mới khác data cũ → re-render + cập nhật localStorage
 */

import { useQuery, type QueryKey } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { getPersistedQueryData, persistQueryData } from '@/lib/queryPersistence';

interface UsePersistentQueryOptions<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  cacheKey: string;
  maxAge?: number;
  enabled?: boolean;
  initialData?: T;
}

export function usePersistentQuery<T>({
  queryKey,
  queryFn,
  cacheKey,
  maxAge,
  enabled,
  initialData: externalInitialData,
}: UsePersistentQueryOptions<T>) {
  // Dùng ref để chỉ đọc localStorage 1 lần duy nhất (tránh re-read mỗi render)
  const cachedRef = useRef<{ data: T; timestamp: number } | null>(null);
  const hasReadCache = useRef(false);

  if (!hasReadCache.current) {
    cachedRef.current = getPersistedQueryData<T>(cacheKey, maxAge);
    hasReadCache.current = true;
  }

  // Ưu tiên: externalInitialData (từ SSR) > localStorage cache
  const resolvedInitialData = externalInitialData ?? cachedRef.current?.data;
  const resolvedInitialDataUpdatedAt = externalInitialData
    ? undefined // Nếu có SSR data → để TanStack Query tự quyết staleTime
    : cachedRef.current?.timestamp; // Nếu từ localStorage → truyền timestamp để TanStack Query biết data cũ

  const query = useQuery({
    queryKey,
    queryFn,
    enabled,
    initialData: resolvedInitialData,
    initialDataUpdatedAt: resolvedInitialDataUpdatedAt,
    staleTime: 0, // Data luôn "stale" → trigger background refetch ngay
  });

  // Persist data mới vào localStorage mỗi khi data thay đổi
  useEffect(() => {
    if (query.data && query.isSuccess && !query.isPlaceholderData) {
      persistQueryData(cacheKey, query.data);
    }
  }, [query.data, query.isSuccess, query.isPlaceholderData, cacheKey]);

  return query;
}
