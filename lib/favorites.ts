import { LOCAL_STORAGE_KEYS } from './constants';

export const RECENT_VIEWED_UPDATED_EVENT = 'recent_viewed_updated';

export function addToRecentViewedProducts(productId: string | undefined) {
  if (!productId || typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.RECENT_VIEWED_PRODUCTS);
    let list: string[] = stored ? JSON.parse(stored) : [];
    
    // If it's already in the list, remove it so it can be moved to the front
    list = list.filter(id => id !== productId);
    
    // Add to beginning
    list.unshift(productId);
    
    // Keep only up to 20 items
    if (list.length > 20) {
      list.pop(); // Remove last element
    }
    
    localStorage.setItem(LOCAL_STORAGE_KEYS.RECENT_VIEWED_PRODUCTS, JSON.stringify(list));
    window.dispatchEvent(new Event(RECENT_VIEWED_UPDATED_EVENT));
  } catch (err) {
    console.error('Failed to update RecentViewedProducts in localStorage', err);
  }
}

export function getRecentViewedProducts(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.RECENT_VIEWED_PRODUCTS);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('Failed to get RecentViewedProducts from localStorage', err);
    return [];
  }
}

export const FAVORITES_UPDATED_EVENT = 'favorites_updated';

export function getFavoriteProducts(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_FAVORITES);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('Failed to get UserFavorites from localStorage', err);
    return [];
  }
}

export function isFavoriteProduct(productId: string): boolean {
  if (!productId) return false;
  const list = getFavoriteProducts();
  return list.includes(productId);
}

export function toggleFavoriteProduct(productId: string): boolean {
  if (!productId || typeof window === 'undefined') return false;

  try {
    let list = getFavoriteProducts();
    const isFav = list.includes(productId);
    
    if (isFav) {
      list = list.filter(id => id !== productId);
    } else {
      list.unshift(productId);
    }
    
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_FAVORITES, JSON.stringify(list));
    window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
    
    return !isFav;
  } catch (err) {
    console.error('Failed to update UserFavorites in localStorage', err);
    return false;
  }
}
