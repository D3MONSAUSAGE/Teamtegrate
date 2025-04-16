
import { User, Task, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const fetchTasks = async (user: User | null, setTasks: React.Dispatch<React.SetStateAction<Task[]>>) => {
  try {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      return;
    }
    
    if (data) {
      const formattedTasks = data.map(task => ({
        ...task,
        id: task.id,
        userId: task.user_id,
        projectId: task.project_id,
        title: task.title || '',
        description: task.description || '',
        deadline: new Date(task.deadline || Date.now()),
        priority: (task.priority as any) || 'Medium',
        status: (task.status as any) || 'To Do',
        createdAt: new Date(task.created_at || Date.now()),
        updatedAt: new Date(task.updated_at || Date.now()),
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
        assignedToId: task.assigned_to_id,
      }));
      
      setTasks(formattedTasks);
    }
  } catch (error) {
    console.error('Error in fetchTasks:', error);
  }
};

export const fetchProjects = async (user: User | null, setProjects: React.Dispatch<React.SetStateAction<Project[]>>) => {
  try {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('manager_id', user.id);
    
    if (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
      return;
    }
    
    if (data) {
      const formattedProjects = await Promise.all(data.map(async (project) => {
        const { data: projectTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', project.id);
        
        const formattedProjectTasks = projectTasks ? projectTasks.map(task => ({
          ...task,
          id: task.id,
          userId: task.user_id,
          projectId: task.project_id,
          title: task.title || '',
          description: task.description || '',
          deadline: new Date(task.deadline || Date.now()),
          priority: (task.priority as any) || 'Medium',
          status: (task.status as any) || 'To Do',
          createdAt: new Date(task.created_at || Date.now()),
          updatedAt: new Date(task.updated_at || Date.now()),
          completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
          assignedToId: task.assigned_to_id,
        })) : [];
        
        return {
          id: project.id,
          title: project.title || '',
          description: project.description || '',
          startDate: new Date(project.start_date || Date.now()),
          endDate: new Date(project.end_date || Date.now()),
          managerId: project.manager_id || '',
          createdAt: new Date(project.created_at || Date.now()),
          updatedAt: new Date(project.updated_at || Date.now()),
          tasks: formattedProjectTasks,
          teamMembers: [],
          tags: [],
        };
      }));
      
      setProjects(formattedProjects);
    }
  } catch (error) {
    console.error('Error in fetchProjects:', error);
  }
};
