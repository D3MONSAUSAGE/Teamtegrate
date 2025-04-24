import React, { useState, useCallback } from 'react';
import { useTask } from '@/contexts/task';
import { Project } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectContainer } from '@/components/project/ProjectContainer';
import ProjectContent from '@/components/project/ProjectContent';

const ProjectsPage = () => {
  const { user } = useAuth();
  const { projects } = useTask();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  
  useEffect(() => {
    if (Array.isArray(projects)) {
      setLocalProjects(projects);
      setIsLoading(false);
      setError(undefined);
    }
  }, [projects]);
  
  const handleRetry = useCallback(async () => {
    if (!user) {
      toast.error('You must be logged in to view projects');
      return;
    }
    
    setIsLoading(true);
    setError(undefined);
    
    try {
      console.log('Manually fetching projects for user:', user.id);
      
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*');

      if (projectError) {
        throw new Error(`Failed to load projects: ${projectError.message}`);
      }

      if (!projectData || projectData.length === 0) {
        setLocalProjects([]);
        setIsLoading(false);
        return;
      }
      
      const basicProjects = projectData.map(p => ({
        id: p.id,
        title: p.title || 'Untitled',
        description: p.description || '',
        startDate: new Date(p.start_date || new Date()),
        endDate: new Date(p.end_date || new Date()),
        managerId: p.manager_id || '',
        createdAt: new Date(p.created_at || new Date()),
        updatedAt: new Date(p.updated_at || new Date()),
        tasks: [],
        teamMembers: [],
        budget: p.budget || 0,
        budgetSpent: p.budget_spent || 0,
        is_completed: p.is_completed || false
      }));
      
      setLocalProjects(basicProjects);
      toast.success('Projects loaded successfully');
      
    } catch (err: any) {
      console.error('Manual project fetch failed:', err);
      setError(err.message || 'Failed to load projects');
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!Array.isArray(projects) || projects.length === 0) {
        handleRetry();
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [projects, handleRetry]);

  return (
    <ProjectContainer>
      <ProjectContent
        projects={localProjects}
        isLoading={isLoading}
        error={error}
        onRetry={handleRetry}
      />
    </ProjectContainer>
  );
};

export default ProjectsPage;
