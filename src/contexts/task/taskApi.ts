
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

    // Get all user IDs that are assigned to tasks to fetch their names
    const assignedUserIds = taskData
      .filter(task => task.assigned_to_id)
      .map(task => task.assigned_to_id);

    // Remove duplicates
    const uniqueUserIds = [...new Set(assignedUserIds)];
    
    // Fetch user names for assigned users
    let userMap = new Map();
    if (uniqueUserIds.length > 0) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', uniqueUserIds);

      if (userError) {
        console.error('Error fetching user data for task assignments:', userError);
      } else if (userData) {
        userData.forEach(user => {
          userMap.set(user.id, user.name || user.email);
        });
      }
    }

    // Map tasks with their comments and assigned user names
    const tasks: Task[] = taskData.map((task) => {
      // Get the assigned user name from our map
      const assignedUserName = task.assigned_to_id ? userMap.get(task.assigned_to_id) : undefined;

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
        assignedToName: assignedUserName,
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
      is_completed: project.is_completed || false,
      status: project.status || 'To Do',
      tasks_count: project.tasks_count || 0
    }));

    setProjects(formattedProjects);
  } catch (error) {
    console.error('Error in fetchProjects:', error);
    toast.error('Failed to load projects');
  }
};
