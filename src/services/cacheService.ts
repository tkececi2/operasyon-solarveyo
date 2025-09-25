/**
 * Cache Service
 * Firebase query sonuçlarını önbellekleme servisi
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  forceRefresh?: boolean; // Force refresh cache
}

class CacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 dakika

  /**
   * Cache'e veri ekle
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt
    });

    // Debug
    console.log(`📦 Cached: ${key} (TTL: ${(ttl || this.defaultTTL) / 1000}s)`);
  }

  /**
   * Cache'den veri al
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Süre kontrolü
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      console.log(`⏰ Cache expired: ${key}`);
      return null;
    }

    console.log(`✅ Cache hit: ${key}`);
    return item.data as T;
  }

  /**
   * Cache'de veri var mı ve geçerli mi?
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Cache'i temizle
   */
  clear(pattern?: string): void {
    if (pattern) {
      // Pattern'e uyan key'leri sil
      const keysToDelete: string[] = [];
      
      this.cache.forEach((_, key) => {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => this.cache.delete(key));
      console.log(`🗑️ Cleared ${keysToDelete.length} cache entries matching: ${pattern}`);
    } else {
      // Tüm cache'i temizle
      const size = this.cache.size;
      this.cache.clear();
      console.log(`🗑️ Cleared all ${size} cache entries`);
    }
  }

  /**
   * Cache boyutunu al
   */
  getSize(): number {
    return this.cache.size;
  }

  /**
   * Cache istatistikleri
   */
  getStats(): {
    size: number;
    keys: string[];
    memoryUsage: string;
  } {
    const keys = Array.from(this.cache.keys());
    
    // Yaklaşık bellek kullanımı
    let totalBytes = 0;
    this.cache.forEach((item) => {
      totalBytes += JSON.stringify(item).length;
    });

    return {
      size: this.cache.size,
      keys,
      memoryUsage: `${(totalBytes / 1024).toFixed(2)} KB`
    };
  }

  /**
   * Expired cache'leri temizle
   */
  cleanup(): void {
    let cleaned = 0;
    const now = Date.now();

    this.cache.forEach((item, key) => {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  /**
   * Otomatik cleanup başlat
   */
  startAutoCleanup(intervalMs: number = 60000): void {
    setInterval(() => {
      this.cleanup();
    }, intervalMs);
    
    console.log(`⏰ Auto cleanup started (every ${intervalMs / 1000}s)`);
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Auto cleanup başlat (her dakika)
cacheService.startAutoCleanup();

/**
 * Cached query wrapper
 * Firebase query'lerini cache'leyerek çalıştırır
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl, forceRefresh = false } = options;

  // Force refresh değilse cache'den kontrol et
  if (!forceRefresh) {
    const cached = cacheService.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  }

  // Query'yi çalıştır
  console.log(`🔄 Fetching: ${key}`);
  const data = await queryFn();

  // Cache'e kaydet
  cacheService.set(key, data, ttl);

  return data;
}

/**
 * Cache decorator for class methods
 */
export function Cached(ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Cache key oluştur
      const key = `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`;

      // Cache'den kontrol et
      const cached = cacheService.get(key);
      if (cached !== null) {
        return cached;
      }

      // Original method'u çalıştır
      const result = await originalMethod.apply(this, args);

      // Cache'e kaydet
      cacheService.set(key, result, ttl);

      return result;
    };

    return descriptor;
  };
}

// Helper functions
export const clearCache = (pattern?: string) => cacheService.clear(pattern);
export const getCacheStats = () => cacheService.getStats();
export const getCacheSize = () => cacheService.getSize();
