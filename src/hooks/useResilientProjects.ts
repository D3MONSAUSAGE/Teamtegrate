import { useState, useEffect, useCallback } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Project } from '@/types';
import { requestManager } from '@/utils/requestManager';
import { toast } from '@/components/ui/sonner';

interface UseResilientProjectsOptions {
  enableOfflineMode?: boolean;
  cacheTimeout?: number;
  retryAttempts?: number;
}

export const useResilientProjects = (options: UseResilientProjectsOptions = {}) => {
  const {
    enableOfflineMode = true,
    cacheTimeout = 300000, // 5 minutes
    retryAttempts = 3
  } = options;

  const { projects, loading, error, refetch, createProject, deleteProject } = useProjects();
  const [cachedProjects, setCachedProjects] = useState<Project[]>([]);
  const [isShowingCached, setIsShowingCached] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState<Date | null>(null);

  // Cache successful data - ensure we always work with arrays
  useEffect(() => {
    const safeProjects = Array.isArray(projects) ? projects : [];
    
    if (safeProjects.length > 0 && !loading && !error) {
      console.log('useResilientProjects: Caching successful user-specific project data:', safeProjects.length);
      setCachedProjects(safeProjects);
      setIsShowingCached(false);
      setRetryCount(0);
      setLastSuccessfulFetch(new Date());
      
      // Store in localStorage for offline access with user-specific key
      if (enableOfflineMode) {
        try {
          localStorage.setItem('user_projects_cache', JSON.stringify({
            data: safeProjects,
            timestamp: Date.now()
          }));
          console.log('useResilientProjects: User-specific projects cached to localStorage');
        } catch (e) {
          console.warn('Failed to cache projects to localStorage:', e);
        }
      }
    }
  }, [projects, loading, error, enableOfflineMode]);

  // Load from cache on error or initial load - ensure arrays
  useEffect(() => {
    if (error && cachedProjects.length === 0 && enableOfflineMode) {
      try {
        const cached = localStorage.getItem('user_projects_cache');
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          
          if (age < cacheTimeout && Array.isArray(data)) {
            console.log('useResilientProjects: Loading user-specific projects from cache due to error');
            setCachedProjects(data);
            setIsShowingCached(true);
            toast.info('Showing cached projects - trying to refresh...');
          } else {
            console.log('useResilientProjects: Cached user-specific projects too old or invalid, not using');
          }
        }
      } catch (e) {
        console.warn('Failed to load cached projects:', e);
      }
    }
  }, [error, cachedProjects.length, enableOfflineMode, cacheTimeout]);

  // Auto-retry on error with exponential backoff
  useEffect(() => {
    if (error && retryCount < retryAttempts) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
      console.log(`useResilientProjects: Auto-retrying user-specific projects fetch (attempt ${retryCount + 1}/${retryAttempts}) in ${delay}ms`);
      
      const timeoutId = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        refetch();
      }, delay);

      return () => clearTimeout(timeoutId);
    }
  }, [error, retryCount, retryAttempts, refetch]);

  const handleRetry = useCallback(async () => {
    console.log('useResilientProjects: Manual retry triggered for user-specific projects');
    setRetryCount(0);
    setIsShowingCached(false);
    
    // Clear request cache
    requestManager.clearCache();
    
    try {
      await refetch();
      toast.success('Projects refreshed successfully');
    } catch (err) {
      console.error('Manual retry failed:', err);
      toast.error('Unable to refresh projects - check your connection');
    }
  }, [refetch]);

  const handleCreateProject = useCallback(async (...args: Parameters<typeof createProject>) => {
    try {
      const result = await createProject(...args);
      toast.success('Project created successfully');
      return result;
    } catch (err) {
      toast.error('Failed to create project - please try again');
      throw err;
    }
  }, [createProject]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      await deleteProject(projectId);
      toast.success('Project deleted successfully');
    } catch (err) {
      toast.error('Failed to delete project - please try again');
      throw err;
    }
  }, [deleteProject]);

  // Ensure displayProjects is always an array
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeCachedProjects = Array.isArray(cachedProjects) ? cachedProjects : [];
  const displayProjects = isShowingCached ? safeCachedProjects : safeProjects;
  
  const isStale = isShowingCached || (lastSuccessfulFetch && (Date.now() - lastSuccessfulFetch.getTime()) > cacheTimeout);

  return {
    projects: displayProjects,
    isLoading: loading && !isShowingCached,
    error: retryCount >= retryAttempts ? error : null,
    isShowingCached,
    isStale,
    lastSuccessfulFetch,
    retryCount,
    maxRetries: retryAttempts,
    refetch: handleRetry,
    createProject: handleCreateProject,
    deleteProject: handleDeleteProject
  };
};
