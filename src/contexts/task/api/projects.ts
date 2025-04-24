
import { Project, Task, TaskPriority, TaskStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

// Helper function to convert Supabase date strings to Date objects
const parseDate = (dateStr: string | null): Date => {
  if (!dateStr) return new Date();
  return new Date(dateStr);
};

export const fetchProjects = async (
  user: { id: string },
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
): Promise<void> => {
  try {
    if (!user) {
      console.log('No user found, skipping project fetch');
      setProjects([]);
      return;
    }

    console.log('Fetching projects for user:', user.id);
    
    // Simplified fetch - no filters to allow seeing all projects
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*');

    if (projectError) {
      console.error('Error fetching projects:', projectError);
      toast.error('Failed to load projects');
      setProjects([]);
      return;
    }

    if (!projectData || projectData.length === 0) {
      console.log('No projects found');
      setProjects([]);
      return;
    }
    
    // Transform the data to match our expected Project type without additional queries
    const projects: Project[] = projectData.map(project => {
      return {
        id: project.id,
        title: project.title || '',
        description: project.description || '',
        startDate: parseDate(project.start_date),
        endDate: parseDate(project.end_date),
        managerId: project.manager_id || user.id,
        tasks: [], // We'll load tasks separately if needed
        createdAt: parseDate(project.created_at),
        updatedAt: parseDate(project.updated_at),
        budget: project.budget || 0,
        budgetSpent: project.budget_spent || 0,
        is_completed: project.is_completed || false,
        teamMembers: [] // We'll load team members separately if needed
      };
    });

    console.log('Successfully fetched projects:', projects.length);
    setProjects(projects);
    
  } catch (err) {
    console.error('Failed to fetch projects:', err);
    toast.error('Failed to load projects');
    setProjects([]);
  }
};
