
import { useMemo } from 'react';
import { Project } from '@/types';

export const useProjectAccess = (projectId: string | null, projects: Project[]) => {
  const project = useMemo(() => {
    if (!projectId) return null;
    const foundProject = projects.find(p => p.id === projectId);
    if (!foundProject) return null;
    
    // Return project without tasks property to match Project type
    const { ...projectWithoutTasks } = foundProject;
    return projectWithoutTasks;
  }, [projectId, projects]);

  const isLoading = false; // Since projects are passed in, no loading state needed
  const loadError = null; // No error handling needed at this level

  return {
    project,
    isLoading,
    loadError
  };
};
