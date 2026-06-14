
export const CACHE_KEYS = {
  MENU: 'app_cache_menu',
  USER_FAVORITES: 'app_cache_favorites',
};

const DEFAULT_TTL = 1000 * 60 * 60; // 1 hour

interface CacheItem<T> {
  data: T;
  expiry: number;
}

export const cacheService = {
  set: <T>(key: string, data: T, ttl: number = DEFAULT_TTL): void => {
    const saveData = (k: string, d: any) => {
        const item: CacheItem<any> = {
            data: d,
            expiry: Date.now() + ttl,
        };
        localStorage.setItem(k, JSON.stringify(item));
    };

    try {
      saveData(key, data);
    } catch (e) {
      if (e instanceof DOMException && 
          (e.name === 'QuotaExceededError' || 
           e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || 
           e.code === 22)) {
        
        console.warn(`LocalStorage quota exceeded. Reclaiming space for: ${key}`);
        
        // 1. Preserve critical session data
        const sessionUser = localStorage.getItem('app_session_user');
        const cart = localStorage.getItem('cart');
        
        // 2. Wipe everything else to get the full ~5MB back
        localStorage.clear();
        
        // 3. Restore session
        if (sessionUser) localStorage.setItem('app_session_user', sessionUser);
        if (cart) localStorage.setItem('cart', cart);
        
        try {
          // 4. Try original data again
          saveData(key, data);
        } catch (retryError) {
          // 5. If still failing, it's just too big. Try "Super Lite" version.
          if (key === CACHE_KEYS.MENU && Array.isArray(data)) {
            console.warn('Still too large. Caching essential text-only fields.');
            const superLiteData = data.map((item: any) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              isAvailable: item.isAvailable,
              category: item.category,
              emoji: item.emoji,
              // Completely strip large fields
              imageUrl: '', 
              description: '',
              comboItems: []
            }));
            
            try {
              saveData(key, superLiteData);
            } catch (finalError) {
              console.error('LocalStorage is completely full or data exceeds 5MB limit. Caching disabled.', finalError);
            }
          }
        }
      } else {
        console.warn('Failed to save to cache', e);
      }
    }
  },

  get: <T>(key: string): T | null => {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;

      const item: CacheItem<T> = JSON.parse(itemStr);
      if (Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return item.data;
    } catch (e) {
      return null;
    }
  },

  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
  
  clearAll: (): void => {
      Object.values(CACHE_KEYS).forEach(key => localStorage.removeItem(key));
  }
};
