
import { User, Task } from '@/types';
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
    console.log('🚀 Fetching tasks for user:', user.id);
    
    // Fetch tasks with improved filtering logic
    // Include tasks where user is creator, assigned, or has project access
    const { data: taskData, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`user_id.eq.${user.id},assigned_to_id.eq.${user.id},assigned_to_ids.cs.{${user.id}}`);

    if (error) {
      console.error('❌ Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      return;
    }

    console.log(`📊 Fetched ${taskData.length} tasks from database`);

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
        console.error('❌ Error fetching user data for task assignments:', userError);
      } else if (userData) {
        userData.forEach(user => {
          userMap.set(user.id, user.name || user.email);
        });
      }
    }

    // Map tasks with their assigned user names
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

    console.log(`✅ Final task count being set: ${tasks.length}`);
    setTasks(tasks);
  } catch (error) {
    console.error('❌ Error in fetchTasks:', error);
    toast.error('Failed to load tasks');
  }
};

// Remove fetchUserProjects function - now handled by useProjects hook
// This eliminates duplicate project fetching logic and ensures consistency
