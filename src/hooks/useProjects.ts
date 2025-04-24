
import { useState, useEffect } from 'react';
import { Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProjects(data.map(project => ({
        ...project,
        startDate: new Date(project.start_date),
        endDate: new Date(project.end_date),
        tasks: []
      })));
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
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          title: projectData.title,
          description: projectData.description,
          start_date: projectData.startDate.toISOString(),
          end_date: projectData.endDate.toISOString(),
          manager_id: projectData.managerId,
          budget: projectData.budget || 0,
          is_completed: false
        }])
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => [{
        ...data,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        tasks: []
      }, ...prev]);

      toast.success('Project created successfully');
      return data;
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
