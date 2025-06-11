
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
    
    // Use explicit any type to avoid deep inference
    const tasksQuery = await supabase
      .from('tasks')
      .select('*')
      .eq('organization_id', user.organization_id);

    if (tasksQuery.error) {
      console.error('Error fetching tasks:', tasksQuery.error);
      toast.error('Failed to load tasks');
      return;
    }

    console.log(`Fetched ${tasksQuery.data?.length || 0} tasks from database`);
    
    // Use explicit any type to avoid deep inference
    const commentsQuery = await supabase
      .from('comments')
      .select('*')
      .eq('organization_id', user.organization_id);

    if (commentsQuery.error) {
      console.error('Error fetching comments:', commentsQuery.error);
    }

    // Manual transformation with explicit any types
    const transformedTasks: Task[] = [];
    
    if (tasksQuery.data) {
      // Use explicit any[] to prevent deep type inference
      const rawTasks: any[] = tasksQuery.data;
      
      for (const dbTask of rawTasks) {
        // Explicit type checks and assignments
        let taskPriority: 'Low' | 'Medium' | 'High' = 'Medium';
        if (dbTask.priority === 'Low' || dbTask.priority === 'Medium' || dbTask.priority === 'High') {
          taskPriority = dbTask.priority;
        }
        
        let taskStatus: 'To Do' | 'In Progress' | 'Completed' = 'To Do';
        if (dbTask.status === 'To Do' || dbTask.status === 'In Progress' || dbTask.status === 'Completed') {
          taskStatus = dbTask.status;
        }

        // Build task with explicit type annotations
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
            ? dbTask.assigned_to_ids.map((id: any) => String(id)) 
            : [],
          assignedToNames: Array.isArray(dbTask.assigned_to_names) 
            ? dbTask.assigned_to_names.map((name: any) => String(name)) 
            : [],
          tags: [],
          comments: commentsQuery.data ? commentsQuery.data
            .filter((comment: any) => comment.task_id === dbTask.id)
            .map((comment: any) => ({
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
