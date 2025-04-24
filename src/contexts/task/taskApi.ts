import { User, Task, Project } from '@/types';
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

  try {
    // Fetch tasks from supabase
    const { data: taskData, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      return;
    }

    const parseDate = (dateStr: string | null): Date => {
      if (!dateStr) return new Date();
      return new Date(dateStr);
    };

    // Map tasks with their comments
    const tasks: Task[] = taskData.map((task) => {
      return {
        id: task.id,
        userId: task.user_id,
        projectId: task.project_id,
        title: task.title || '',
        description: task.description || '',
        deadline: parseDate(task.deadline),
        priority: (task.priority as Task['priority']) || 'Medium',
        status: (task.status || 'To Do') as Task['status'],
        createdAt: parseDate(task.created_at),
        updatedAt: parseDate(task.updated_at),
        completedAt: task.completed_at ? parseDate(task.completed_at) : undefined,
        assignedToId: task.assigned_to_id,
        assignedToName: task.assigned_to_id,
        comments: [],
        cost: task.cost || 0
      };
    });

    setTasks(tasks);
  } catch (error) {
    console.error('Error in fetchTasks:', error);
    toast.error('Failed to load tasks');
  }
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
