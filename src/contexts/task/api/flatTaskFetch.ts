
import { FlatTask, FlatUser, RawTaskRow, RawCommentRow } from '@/types/flat';
import { mapRawTaskToFlat, mapRawCommentToFlat } from '@/utils/dataMappers';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

export const fetchFlatTasks = async (
  user: FlatUser,
  setTasks: (tasks: FlatTask[]) => void
): Promise<void> => {
  try {
    console.log('Fetching flat tasks for user:', user?.id, 'org:', user?.organization_id);
    
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
      .select('id, user_id, project_id, title, description, deadline, priority, status, created_at, updated_at, assigned_to_id, assigned_to_ids, assigned_to_names, cost');

    // Cast to avoid type inference issues
    const tasksResponse = tasksQuery as any;

    if (tasksResponse.error) {
      console.error('Error fetching tasks:', tasksResponse.error);
      toast.error('Failed to load tasks');
      return;
    }

    console.log(`Fetched ${tasksResponse.data?.length || 0} tasks from database`);
    
    // Fetch comments with explicit column selection
    const commentsQuery = await supabase
      .from('comments')
      .select('id, user_id, task_id, content, created_at');

    const commentsResponse = commentsQuery as any;

    if (commentsResponse.error) {
      console.error('Error fetching comments:', commentsResponse.error);
    }

    // Manual transformation with explicit types
    const transformedTasks: FlatTask[] = [];
    
    if (tasksResponse.data) {
      for (const dbTask of tasksResponse.data) {
        const task = mapRawTaskToFlat(dbTask as RawTaskRow);
        transformedTasks.push(task);
      }
    }

    setTasks(transformedTasks);
    console.log(`Successfully processed ${transformedTasks.length} flat tasks`);
  } catch (error) {
    console.error('Error in fetchFlatTasks:', error);
    toast.error('Failed to load tasks');
  }
};
