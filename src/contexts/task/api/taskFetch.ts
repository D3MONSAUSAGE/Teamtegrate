
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { validateUserOrganization } from '@/utils/organizationHelpers';

const parseDate = (dateStr: string | null): Date => {
  if (!dateStr) return new Date();
  return new Date(dateStr);
};

export const fetchTasks = async (
  user: { id: string, organization_id?: string },
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
): Promise<void> => {
  try {
    console.log('Fetching tasks for user:', user.id, 'org:', user.organization_id);
    
    if (!validateUserOrganization(user)) {
      console.error('User missing organization_id');
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

    // Transform database format to application format
    const transformedTasks: Task[] = taskData.map((dbTask) => ({
      id: dbTask.id,
      userId: dbTask.user_id || user.id,
      projectId: dbTask.project_id || undefined,
      title: dbTask.title || '',
      description: dbTask.description || '',
      deadline: parseDate(dbTask.deadline),
      priority: (dbTask.priority as Task['priority']) || 'Medium',
      status: (dbTask.status as Task['status']) || 'To Do',
      createdAt: parseDate(dbTask.created_at),
      updatedAt: parseDate(dbTask.updated_at),
      assignedToId: dbTask.assigned_to_id || undefined,
      assignedToName: dbTask.assigned_to_names?.[0] || undefined, // Use first name from array
      assignedToIds: dbTask.assigned_to_ids || [],
      assignedToNames: dbTask.assigned_to_names || [],
      tags: [],
      comments: (commentData || [])
        .filter(comment => comment.task_id === dbTask.id)
        .map(comment => ({
          id: comment.id,
          userId: comment.user_id,
          userName: 'User', // Will be populated from user data
          text: comment.content,
          createdAt: parseDate(comment.created_at),
        })),
      cost: Number(dbTask.cost) || 0,
    }));

    setTasks(transformedTasks);
    console.log(`Successfully processed ${transformedTasks.length} tasks`);
  } catch (error) {
    console.error('Error in fetchTasks:', error);
    toast.error('Failed to load tasks');
  }
};
