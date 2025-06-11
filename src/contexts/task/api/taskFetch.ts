
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

const parseDate = (dateStr: string | null): Date => {
  if (!dateStr) return new Date();
  return new Date(dateStr);
};

// Simple user interface
interface SimpleUser {
  id: string;
  organization_id?: string;
}

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
    const { data: taskData, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('organization_id', user.organization_id);

    if (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      return;
    }

    console.log(`Fetched ${taskData.length} tasks from database`);
    
    // Fetch comments for all tasks with organization filtering
    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('organization_id', user.organization_id);

    if (commentError) {
      console.error('Error fetching comments:', commentError);
    }

    // Transform database format to application format with simple type casting
    const transformedTasks: Task[] = taskData.map((dbTask: any) => {
      // Use simple type guards instead of complex type instantiation
      const taskPriority = ['Low', 'Medium', 'High'].includes(dbTask.priority) 
        ? dbTask.priority 
        : 'Medium';
      
      const taskStatus = ['To Do', 'In Progress', 'Completed'].includes(dbTask.status)
        ? dbTask.status
        : 'To Do';

      return {
        id: dbTask.id,
        userId: dbTask.user_id || user.id,
        projectId: dbTask.project_id || undefined,
        title: dbTask.title || '',
        description: dbTask.description || '',
        deadline: parseDate(dbTask.deadline),
        priority: taskPriority as any,
        status: taskStatus as any,
        createdAt: parseDate(dbTask.created_at),
        updatedAt: parseDate(dbTask.updated_at),
        assignedToId: dbTask.assigned_to_id || undefined,
        assignedToName: dbTask.assigned_to_names?.[0] || undefined,
        assignedToIds: dbTask.assigned_to_ids || [],
        assignedToNames: dbTask.assigned_to_names || [],
        tags: [],
        comments: (commentData || [])
          .filter((comment: any) => comment.task_id === dbTask.id)
          .map((comment: any) => ({
            id: comment.id,
            userId: comment.user_id,
            userName: 'User',
            text: comment.content,
            createdAt: parseDate(comment.created_at),
          })),
        cost: Number(dbTask.cost) || 0,
      };
    });

    setTasks(transformedTasks);
    console.log(`Successfully processed ${transformedTasks.length} tasks`);
  } catch (error) {
    console.error('Error in fetchTasks:', error);
    toast.error('Failed to load tasks');
  }
};
