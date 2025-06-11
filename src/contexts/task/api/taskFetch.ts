
import { Task } from '@/types';
import { SimpleUser, RawTask, RawComment } from '@/types/simplified';
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
    
    // Explicit column selection to avoid deep type inference
    const tasksQuery = await supabase
      .from('tasks')
      .select('id, user_id, project_id, title, description, deadline, priority, status, created_at, updated_at, assigned_to_id, assigned_to_ids, assigned_to_names, cost')
      .eq('organization_id', user.organization_id);

    // Cast to avoid type inference issues
    const tasksResponse = tasksQuery as unknown as { data: RawTask[] | null, error: any };

    if (tasksResponse.error) {
      console.error('Error fetching tasks:', tasksResponse.error);
      toast.error('Failed to load tasks');
      return;
    }

    console.log(`Fetched ${tasksResponse.data?.length || 0} tasks from database`);
    
    // Fetch comments with explicit column selection
    const commentsQuery = await supabase
      .from('comments')
      .select('id, user_id, task_id, content, created_at')
      .eq('organization_id', user.organization_id);

    const commentsResponse = commentsQuery as unknown as { data: RawComment[] | null, error: any };

    if (commentsResponse.error) {
      console.error('Error fetching comments:', commentsResponse.error);
    }

    // Manual transformation with explicit types
    const transformedTasks: Task[] = [];
    
    if (tasksResponse.data) {
      for (const dbTask of tasksResponse.data) {
        // Explicit type validation
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
          comments: commentsResponse.data ? commentsResponse.data
            .filter((comment: RawComment) => comment.task_id === dbTask.id)
            .map((comment: RawComment) => ({
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
