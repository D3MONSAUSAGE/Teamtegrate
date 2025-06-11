
import { Task } from '@/types';
import { SimpleUser } from '@/types/simplified';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

const parseDate = (dateStr: string | null): Date => {
  if (!dateStr) return new Date();
  return new Date(dateStr);
};

export const fetchTasks = async (
  user: SimpleUser,
  setTasks: (tasks: Task[]) => void
): Promise<void> => {
  try {
    console.log('Fetching tasks for user:', user?.id, 'org:', user?.organization_id);
    
    if (!user) {
      console.error('User is required for this operation');
      toast.error('User must belong to an organization to view tasks');
      return;
    }
    
    if (!user.organization_id) {
      console.error('User must belong to an organization');
      toast.error('User must belong to an organization to view tasks');
      return;
    }
    
    // Fetch tasks from database with explicit organization filtering
    const { data: rawTaskData, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('organization_id', user.organization_id);

    if (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      return;
    }

    console.log(`Fetched ${rawTaskData?.length || 0} tasks from database`);
    
    // Fetch comments for all tasks with organization filtering
    const { data: rawCommentData, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('organization_id', user.organization_id);

    if (commentError) {
      console.error('Error fetching comments:', commentError);
    }

    // Transform database format to application format with explicit typing
    const transformedTasks: Task[] = [];
    
    if (rawTaskData) {
      for (const dbTask of rawTaskData) {
        // Validate and set priority with explicit string checks
        const taskPriority = ['Low', 'Medium', 'High'].includes(String(dbTask.priority)) 
          ? String(dbTask.priority) as 'Low' | 'Medium' | 'High'
          : 'Medium' as const;
        
        // Validate and set status with explicit string checks
        const taskStatus = ['To Do', 'In Progress', 'Completed'].includes(String(dbTask.status))
          ? String(dbTask.status) as 'To Do' | 'In Progress' | 'Completed'
          : 'To Do' as const;

        // Build task object with explicit type annotations
        const task: Task = {
          id: String(dbTask.id || ''),
          userId: String(dbTask.user_id || user.id),
          projectId: dbTask.project_id ? String(dbTask.project_id) : undefined,
          title: String(dbTask.title || ''),
          description: String(dbTask.description || ''),
          deadline: parseDate(dbTask.deadline),
          priority: taskPriority,
          status: taskStatus,
          createdAt: parseDate(dbTask.created_at),
          updatedAt: parseDate(dbTask.updated_at),
          assignedToId: dbTask.assigned_to_id ? String(dbTask.assigned_to_id) : undefined,
          assignedToName: dbTask.assigned_to_names?.[0] ? String(dbTask.assigned_to_names[0]) : undefined,
          assignedToIds: Array.isArray(dbTask.assigned_to_ids) 
            ? dbTask.assigned_to_ids.map(String) 
            : [],
          assignedToNames: Array.isArray(dbTask.assigned_to_names) 
            ? dbTask.assigned_to_names.map(String) 
            : [],
          tags: [],
          comments: rawCommentData ? rawCommentData
            .filter((comment) => comment.task_id === dbTask.id)
            .map((comment) => ({
              id: String(comment.id),
              userId: String(comment.user_id),
              userName: 'User',
              text: String(comment.content),
              createdAt: parseDate(comment.created_at),
            })) : [],
          cost: Number(dbTask.cost) || 0,
        };

        transformedTasks.push(task);
      }
    }

    setTasks(transformedTasks);
    console.log(`Successfully processed ${transformedTasks.length} tasks`);
  } catch (error) {
    console.error('Error in fetchTasks:', error);
    toast.error('Failed to load tasks');
  }
};
