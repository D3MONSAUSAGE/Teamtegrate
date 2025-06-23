
import { useMemo } from 'react';
import { Project } from '@/types';
import { useProjects } from '@/hooks/useProjects';

export const useProjectAccess = (projectId: string | null) => {
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();

  const result = useMemo(() => {
    console.log('useProjectAccess: Checking access for project:', {
      projectId,
      projectsLoading,
      projectsError,
      projectsCount: projects?.length || 0,
      hasProjects: !!projects,
      projects: projects?.map(p => ({ id: p.id, title: p.title }))
    });

    // If we're still loading projects, return loading state
    if (projectsLoading) {
      console.log('useProjectAccess: Still loading projects, returning loading state');
      return {
        project: null,
        isLoading: true,
        loadError: null
      };
    }

    // If there was an error loading projects, return error state
    if (projectsError) {
      console.log('useProjectAccess: Error loading projects:', projectsError);
      return {
        project: null,
        isLoading: false,
        loadError: projectsError
      };
    }

    // If no projectId provided, return null project
    if (!projectId) {
      console.log('useProjectAccess: No projectId provided');
      return {
        project: null,
        isLoading: false,
        loadError: null
      };
    }

    // Now that projects are loaded, try to find the specific project
    const foundProject = projects.find(p => p.id === projectId);
    
    if (!foundProject) {
      console.log('useProjectAccess: Project not found after projects loaded:', {
        projectId,
        availableProjectIds: projects.map(p => p.id)
      });
      return {
        project: null,
        isLoading: false,
        loadError: `Project with ID "${projectId}" not found or not accessible`
      };
    }

    console.log('useProjectAccess: Project found successfully:', {
      projectId: foundProject.id,
      projectTitle: foundProject.title
    });

    // Return project without tasks property to match Project type
    const { ...projectWithoutTasks } = foundProject;
    return {
      project: projectWithoutTasks,
      isLoading: false,
      loadError: null
    };
  }, [projectId, projects, projectsLoading, projectsError]);

  return result;
};
