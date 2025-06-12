
import { Task } from '@/types';
import { SimpleUser, RawTask, RawComment } from '@/types/simplified';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { ensureTaskCommentComplete } from '@/utils/typeCompatibility';

const parseDate = (dateStr: string | null): Date => {
  if (!dateStr) return new Date();
  return new Date(dateStr);
};

export const fetchTasks = async (
  user: SimpleUser,
  setTasks: (tasks: Task[]) => void
): Promise<void> => {
  try {
    console.log('📋 Fetching tasks for user with clean RLS:', {
      userId: user?.id,
      email: user?.email,
      organizationId: user?.organization_id
    });
    
    if (!user) {
      console.error('❌ User is required for this operation');
      toast.error('User must belong to an organization to view tasks');
      return;
    }
    
    if (!user.organization_id) {
      console.error('❌ User must belong to an organization');
      toast.error('User must belong to an organization to view tasks');
      return;
    }
    
    // With the new clean RLS policies, we can simply select all tasks
    // The org_isolation_tasks_final policy will automatically filter by organization
    console.log('📋 Executing tasks query with clean RLS filtering...');
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('❌ Error fetching tasks with clean RLS:', tasksError);
      toast.error('Failed to load tasks: ' + tasksError.message);
      return;
    }

    console.log(`✅ Successfully fetched ${tasksData?.length || 0} tasks with clean RLS policies`);
    
    if (!tasksData || tasksData.length === 0) {
      console.log('📋 No tasks found');
      setTasks([]);
      return;
    }
    
    // Fetch comments with explicit column selection
    console.log('💬 Fetching comments...');
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('id, user_id, task_id, content, created_at');

    if (commentsError) {
      console.error('❌ Error fetching comments:', commentsError);
    } else {
      console.log(`✅ Fetched ${commentsData?.length || 0} comments`);
    }

    // Manual transformation with explicit types
    const transformedTasks: Task[] = [];
    
    for (const dbTask of tasksData) {
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
        comments: commentsData ? commentsData
          .filter((comment: any) => comment.task_id === dbTask.id)
          .map((comment: any) => ensureTaskCommentComplete({
            id: String(comment.id),
            userId: String(comment.user_id),
            userName: 'User',
            text: String(comment.content),
            createdAt: parseDate(comment.created_at),
          }, user.organization_id)) : [],
        cost: Number(dbTask.cost) || 0,
        organizationId: user.organization_id
      };

      transformedTasks.push(task);
    }

    console.log(`✅ Successfully processed ${transformedTasks.length} tasks with clean RLS`);
    
    setTasks(transformedTasks);
  } catch (error) {
    console.error('❌ Error in fetchTasks with clean RLS:', error);
    toast.error('Failed to load tasks');
  }
};
