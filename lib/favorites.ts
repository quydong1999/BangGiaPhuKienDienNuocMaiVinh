import { LOCAL_STORAGE_KEYS } from './constants';

export function addToFavoriteProducts(productId: string | undefined) {
  if (!productId || typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.FAVORITE_PRODUCTS);
    let list: string[] = stored ? JSON.parse(stored) : [];
    
    // If it's already in the list, remove it so it can be moved to the front
    list = list.filter(id => id !== productId);
    
    // Add to beginning
    list.unshift(productId);
    
    // Keep only up to 20 items
    if (list.length > 20) {
      list.pop(); // Remove last element
    }
    
    localStorage.setItem(LOCAL_STORAGE_KEYS.FAVORITE_PRODUCTS, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to update FavoriteProducts in localStorage', err);
  }
}
