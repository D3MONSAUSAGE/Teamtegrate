
import { User, Task, Project } from '@/types';
import { fetchTasks } from './api/tasks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Fetch tasks for a user
export const fetchUserTasks = async (
  user: User | null,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
) => {
  if (!user) {
    setTasks([]);
    return;
  }

  await fetchTasks(user, setTasks);
};

// Fetch projects for a user
export const fetchUserProjects = async (
  user: User | null,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  if (!user) {
    setProjects([]);
    return;
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
      return;
    }

    const formattedProjects: Project[] = data.map(project => ({
      id: project.id,
      title: project.title || '',
      description: project.description || '',
      startDate: project.start_date ? new Date(project.start_date) : new Date(),
      endDate: project.end_date ? new Date(project.end_date) : new Date(),
      managerId: project.manager_id || user.id,
      createdAt: project.created_at ? new Date(project.created_at) : new Date(),
      updatedAt: project.updated_at ? new Date(project.updated_at) : new Date(),
      tasks: [],
      teamMembers: [],
      budget: project.budget || 0,
      is_completed: project.is_completed || false
    }));

    setProjects(formattedProjects);
  } catch (error) {
    console.error('Error in fetchProjects:', error);
    toast.error('Failed to load projects');
  }
};
