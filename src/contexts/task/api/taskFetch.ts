
import { Task } from '@/types';
import { SimpleUser, RawTask, RawComment } from '@/types/simplified';
import { toast } from '@/components/ui/sonner';
import { supabase, checkSessionHealth, recoverSession } from '@/integrations/supabase/client';
import { ensureTaskCommentComplete } from '@/utils/typeCompatibility';

const parseDate = (dateStr: string | null): Date => {
  if (!dateStr) return new Date();
  return new Date(dateStr);
};

export const fetchTasks = async (
  user: SimpleUser,
  setTasks: (tasks: Task[]) => void,
  retryCount = 0
): Promise<void> => {
  try {
    console.log('📋 Fetching tasks for user with session-guarded clean RLS:', {
      userId: user?.id,
      email: user?.email,
      organizationId: user?.organization_id,
      attempt: retryCount + 1
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

    // Check session health before querying (on first attempt only)
    if (retryCount === 0) {
      const healthCheck = await checkSessionHealth();
      if (!healthCheck.healthy) {
        console.log('⚠️ Session unhealthy before tasks query, attempting recovery...');
        const recovery = await recoverSession();
        if (recovery.recovered) {
          console.log('✅ Session recovered, retrying tasks fetch...');
          return fetchTasks(user, setTasks, retryCount + 1);
        } else {
          console.error('❌ Session recovery failed');
          toast.error('Session expired. Please refresh the page or log out and back in.');
          return;
        }
      }
    }
    
    // With the new clean RLS policies, we can simply select all tasks
    // The org_isolation_tasks_final policy will automatically filter by organization
    console.log('📋 Executing tasks query with session-guarded clean RLS filtering...');
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('❌ Error fetching tasks with session-guarded clean RLS:', tasksError);
      
      // Check if it's an RLS/permission error
      if (tasksError.message?.includes('policy') || tasksError.message?.includes('permission')) {
        console.log('🔧 RLS policy error detected in tasks, attempting session recovery...');
        if (retryCount === 0) {
          const recovery = await recoverSession();
          if (recovery.recovered) {
            console.log('✅ Session recovered after tasks RLS error, retrying...');
            return fetchTasks(user, setTasks, retryCount + 1);
          }
        }
        toast.error('Unable to access tasks. Session may be expired. Please refresh the page or log out and back in.');
      } else {
        toast.error('Failed to load tasks: ' + tasksError.message);
      }
      return;
    }

    console.log(`✅ Successfully fetched ${tasksData?.length || 0} tasks with session-guarded clean RLS policies`);
    
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

    console.log(`✅ Successfully processed ${transformedTasks.length} tasks with session-guarded clean RLS`);
    
    setTasks(transformedTasks);
  } catch (error) {
    console.error('❌ Error in fetchTasks with session-guarded clean RLS:', error);
    
    // Handle session-related errors gracefully
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message;
      if (errorMessage?.includes('JWT') || errorMessage?.includes('token') || errorMessage?.includes('auth')) {
        toast.error('Authentication error. Please refresh the page or log out and back in.');
      } else {
        toast.error('Failed to load tasks');
      }
    } else {
      toast.error('Failed to load tasks');
    }
  }
};
