import { QueryClient } from '@tanstack/react-query';

export class CacheManager {
  private static queryClient: QueryClient | null = null;

  static setQueryClient(client: QueryClient) {
    this.queryClient = client;
  }

  static async clearAllTaskCaches() {
    if (!this.queryClient) return;

    console.log('CacheManager: Clearing all task-related caches...');
    
    // Clear React Query caches
    await this.queryClient.invalidateQueries({ queryKey: ['tasks'] });
    await this.queryClient.invalidateQueries({ queryKey: ['personal-tasks'] });
    await this.queryClient.invalidateQueries({ queryKey: ['tasks-my-tasks'] });
    await this.queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
    
    // Clear all cache entries
    this.queryClient.removeQueries({ queryKey: ['tasks'] });
    this.queryClient.removeQueries({ queryKey: ['personal-tasks'] });
    this.queryClient.removeQueries({ queryKey: ['tasks-my-tasks'] });
    this.queryClient.removeQueries({ queryKey: ['project-tasks'] });
    
    console.log('CacheManager: All task caches cleared');
  }

  static async clearBrowserStorage() {
    console.log('CacheManager: Clearing browser storage...');
    
    // Clear localStorage task-related data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('task') || key.includes('personal-tasks') || key.includes('REACT_QUERY')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage task-related data
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (key.includes('task') || key.includes('personal-tasks')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('CacheManager: Browser storage cleared');
  }

  static debugCacheState(user: any) {
    if (!this.queryClient) return;

    console.log('=== CACHE DEBUG INFO ===');
    console.log('User info:', {
      id: user?.id,
      organizationId: user?.organizationId,
      email: user?.email
    });

    // Get all queries from cache
    const queryCache = this.queryClient.getQueryCache();
    const queries = queryCache.getAll();
    
    const taskQueries = queries.filter(query => 
      query.queryKey.some(key => 
        typeof key === 'string' && key.includes('task')
      )
    );

    console.log('Task-related queries in cache:', taskQueries.length);
    taskQueries.forEach(query => {
      console.log('Query:', {
        key: query.queryKey,
        state: query.state.status,
        dataLength: Array.isArray(query.state.data) ? query.state.data.length : 'N/A',
        lastUpdated: query.state.dataUpdatedAt ? new Date(query.state.dataUpdatedAt).toLocaleString() : 'Never'
      });
    });
    console.log('=== END CACHE DEBUG ===');
  }

  static async forceRefreshWithDebugging() {
    console.log('CacheManager: Force refreshing all task data...');
    
    // Clear everything
    await this.clearAllTaskCaches();
    await this.clearBrowserStorage();
    
    // Force a page reload to ensure completely fresh state
    console.log('CacheManager: Reloading page to ensure fresh state...');
    window.location.reload();
  }
}