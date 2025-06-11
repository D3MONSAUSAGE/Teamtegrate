
import { useMemo } from 'react';
import { Project } from '@/types';

export const useProjectAccess = (projectId: string | null, projects: Project[]) => {
  const project = useMemo(() => {
    if (!projectId) return null;
    return projects.find(p => p.id === projectId) || null;
  }, [projectId, projects]);

  const isLoading = false; // Since projects are passed in, no loading state needed
  const loadError = null; // No error handling needed at this level

  return {
    project,
    isLoading,
    loadError
  };
};
