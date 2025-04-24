
import { useState, useEffect } from 'react';
import { Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match Project type
      const formattedProjects: Project[] = data.map(project => ({
        id: project.id,
        title: project.title || '',
        description: project.description || '',
        startDate: project.start_date ? new Date(project.start_date) : new Date(),
        endDate: project.end_date ? new Date(project.end_date) : new Date(),
        managerId: project.manager_id || '',
        createdAt: project.created_at ? new Date(project.created_at) : new Date(),
        updatedAt: project.updated_at ? new Date(project.updated_at) : new Date(),
        tasks: [],
        teamMembers: [],
        budget: project.budget || 0,
        is_completed: project.is_completed || false
      }));

      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => {
    try {
      if (!user) {
        toast.error('You must be logged in to create a project');
        return null;
      }
      
      const now = new Date();
      const projectId = crypto.randomUUID();
      
      const { error } = await supabase
        .from('projects')
        .insert({
          id: projectId,
          title: projectData.title,
          description: projectData.description,
          start_date: projectData.startDate.toISOString(),
          end_date: projectData.endDate.toISOString(),
          manager_id: user.id,
          budget: projectData.budget || 0,
          is_completed: false,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        });

      if (error) throw error;

      const newProject: Project = {
        id: projectId,
        title: projectData.title,
        description: projectData.description,
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        managerId: user.id,
        budget: projectData.budget || 0,
        createdAt: now,
        updatedAt: now,
        tasks: [],
        teamMembers: projectData.teamMembers || [],
        is_completed: false
      };

      setProjects(prev => [newProject, ...prev]);

      toast.success('Project created successfully');
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
      return null;
    }
  };

  return {
    projects,
    isLoading,
    addProject,
    refreshProjects: fetchProjects
  };
};
