import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CacheManager } from '@/utils/cacheManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const CacheDebugPanel: React.FC = () => {
  const { user } = useAuth();

  const handleClearCache = async () => {
    await CacheManager.clearAllTaskCaches();
    console.log('Cache cleared manually');
  };

  const handleClearStorage = async () => {
    await CacheManager.clearBrowserStorage();
    console.log('Browser storage cleared manually');
  };

  const handleDebugCache = () => {
    CacheManager.debugCacheState(user);
  };

  const handleForceRefresh = async () => {
    await CacheManager.forceRefreshWithDebugging();
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-background/95 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Cache Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button onClick={handleDebugCache} size="sm" variant="outline" className="w-full">
          Debug Cache State
        </Button>
        <Button onClick={handleClearCache} size="sm" variant="outline" className="w-full">
          Clear Query Cache
        </Button>
        <Button onClick={handleClearStorage} size="sm" variant="outline" className="w-full">
          Clear Browser Storage
        </Button>
        <Button onClick={handleForceRefresh} size="sm" variant="destructive" className="w-full">
          Force Refresh (Reload)
        </Button>
      </CardContent>
    </Card>
  );
};