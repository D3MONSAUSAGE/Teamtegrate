import { UserRole } from '@/types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface UserCacheData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization_id: string;
}

/**
 * User Management Cache Service
 * Implements intelligent caching for user data and operations
 */
class UserManagementCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly ROLE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes for roles
  private readonly USER_LIST_TTL = 3 * 60 * 1000; // 3 minutes for user lists

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    };
    this.cache.set(key, entry);
    console.log(`🗄️ Cache: Set key "${key}" with TTL ${entry.ttl}ms`);
  }

  /**
   * Get cache entry if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      console.log(`🗄️ Cache: Expired and removed key "${key}"`);
      return null;
    }

    console.log(`🗄️ Cache: Hit for key "${key}"`);
    return entry.data as T;
  }

  /**
   * Cache user profile data
   */
  setUserProfile(userId: string, userData: UserCacheData): void {
    this.set(`user:${userId}`, userData, this.DEFAULT_TTL);
  }

  /**
   * Get cached user profile
   */
  getUserProfile(userId: string): UserCacheData | null {
    return this.get<UserCacheData>(`user:${userId}`);
  }

  /**
   * Cache organization users list
   */
  setOrganizationUsers(orgId: string, users: UserCacheData[]): void {
    this.set(`org:${orgId}:users`, users, this.USER_LIST_TTL);
  }

  /**
   * Get cached organization users
   */
  getOrganizationUsers(orgId: string): UserCacheData[] | null {
    return this.get<UserCacheData[]>(`org:${orgId}:users`);
  }

  /**
   * Cache user role information
   */
  setUserRole(userId: string, role: UserRole): void {
    this.set(`role:${userId}`, role, this.ROLE_CACHE_TTL);
  }

  /**
   * Get cached user role
   */
  getUserRole(userId: string): UserRole | null {
    return this.get<UserRole>(`role:${userId}`);
  }

  /**
   * Invalidate user-related caches
   */
  invalidateUser(userId: string): void {
    const keysToRemove = Array.from(this.cache.keys()).filter(key => 
      key.includes(userId) || key.includes('users')
    );
    
    keysToRemove.forEach(key => {
      this.cache.delete(key);
      console.log(`🗄️ Cache: Invalidated key "${key}"`);
    });
  }

  /**
   * Invalidate organization cache
   */
  invalidateOrganization(orgId: string): void {
    const keysToRemove = Array.from(this.cache.keys()).filter(key => 
      key.includes(`org:${orgId}`)
    );
    
    keysToRemove.forEach(key => {
      this.cache.delete(key);
      console.log(`🗄️ Cache: Invalidated org key "${key}"`);
    });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    console.log('🗄️ Cache: Cleared all entries');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    return {
      totalEntries: entries.length,
      expiredEntries: entries.filter(([_, entry]) => 
        now - entry.timestamp > entry.ttl
      ).length,
      validEntries: entries.filter(([_, entry]) => 
        now - entry.timestamp <= entry.ttl
      ).length,
      cacheSize: JSON.stringify(Object.fromEntries(this.cache)).length
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🗄️ Cache: Cleaned up ${expiredKeys.length} expired entries`);
    }
  }
}

export const userManagementCache = new UserManagementCache();

// Auto-cleanup every 5 minutes
setInterval(() => {
  userManagementCache.cleanup();
}, 5 * 60 * 1000);