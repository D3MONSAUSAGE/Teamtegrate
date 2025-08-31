
import { Task } from '@/types';
import { SimpleUser, RawTask, RawComment } from '@/types/simplified';
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
    // Only log in development mode to reduce production overhead
    if (process.env.NODE_ENV === 'development') {
      console.log('fetchTasks: Starting PERSONAL task fetch for user:', { 
        id: user?.id, 
        organizationId: user?.organization_id,
        role: user?.role 
      });
    }
    
    if (!user) {
      // Silently handle - don't show error to user
      return;
    }
    
    if (!user.organization_id) {
      // Silently handle - don't show error to user
      return;
    }
    
    // SIMPLIFIED PERSONAL TASK QUERY: Only fetch tasks that are truly personal:
    // 1. Tasks created by the user
    // 2. Tasks assigned to the user (assigned_to_id = user.id OR user.id in assigned_to_ids)
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('organization_id', user.organization_id)
      .or(`user_id.eq.${user.id},assigned_to_id.eq.${user.id},assigned_to_ids.cs.{${user.id}}`)
      .order('created_at', { ascending: false });

    if (tasksError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('fetchTasks: Error fetching personal tasks:', tasksError);
      }
      // For "set-returning functions" error, silently return empty array
      if (tasksError.message?.includes('set-returning functions are not allowed in WHERE')) {
        setTasks([]);
        return;
      }
      // Silently handle other errors
      setTasks([]);
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`fetchTasks: Retrieved ${tasksData?.length || 0} personal tasks (created by user OR assigned to user)`);
    }
    
    // Enhanced client-side validation for personal tasks
    const validatedTasks = tasksData?.filter(dbTask => {
      // Check organization match
      if (dbTask.organization_id !== user.organization_id) {
        if (process.env.NODE_ENV === 'development') {
          console.error('fetchTasks: Task from different organization filtered out');
        }
        return false;
      }

      // SIMPLIFIED PERSONAL FILTERING: Only include tasks that belong to this user
      const isCreatedByUser = dbTask.user_id === user.id;
      const isAssignedToUser = 
        dbTask.assigned_to_id === user.id || // Single assignee
        (dbTask.assigned_to_ids && dbTask.assigned_to_ids.includes(user.id)); // Multi assignee

      // Show task if: created by user OR assigned to user
      return isCreatedByUser || isAssignedToUser;
    }) || [];
    
    // Fetch comments and users data in parallel for better performance
    const [commentsResult, usersResult] = await Promise.allSettled([
      supabase
        .from('comments')
        .select('id, user_id, task_id, content, created_at')
        .eq('organization_id', user.organization_id),
      supabase
        .from('users')
        .select('id, name, email')
        .eq('organization_id', user.organization_id)
    ]);

    const commentsData = commentsResult.status === 'fulfilled' ? commentsResult.value.data : null;
    const usersData = usersResult.status === 'fulfilled' ? usersResult.value.data : null;

    // Create user lookup map for better performance
    const userMap = new Map();
    if (usersData) {
      usersData.forEach((userData: any) => {
        userMap.set(userData.id, userData);
      });
    }

    // Transform tasks with optimized processing
    const transformedTasks: Task[] = validatedTasks.map(dbTask => {
      // Explicit type validation with defaults
      const taskPriority = ['Low', 'Medium', 'High'].includes(dbTask.priority) ? dbTask.priority : 'Medium';
      const taskStatus = ['To Do', 'In Progress', 'Completed'].includes(dbTask.status) ? dbTask.status : 'To Do';

      // Optimized assignment data processing
      let assignedToId: string | undefined;
      let assignedToName: string | undefined;
      let assignedToIds: string[] = [];
      let assignedToNames: string[] = [];

      // Handle assigned_to_ids array (primary source)
      if (dbTask.assigned_to_ids && Array.isArray(dbTask.assigned_to_ids) && dbTask.assigned_to_ids.length > 0) {
        assignedToIds = dbTask.assigned_to_ids.filter(id => id && id.toString().trim() !== '').map(id => String(id));
        
        if (assignedToIds.length > 0) {
          // Use cached names or lookup
          if (dbTask.assigned_to_names && Array.isArray(dbTask.assigned_to_names) && dbTask.assigned_to_names.length > 0) {
            assignedToNames = dbTask.assigned_to_names.filter(name => name && name.toString().trim() !== '').map(name => String(name));
          } else {
            assignedToNames = assignedToIds.map(id => {
              const assignedUser = userMap.get(id);
              return assignedUser ? (assignedUser.name || assignedUser.email) : 'Unknown User';
            });
          }

          if (assignedToIds.length === 1) {
            assignedToId = assignedToIds[0];
            assignedToName = assignedToNames[0];
          }
        }
      } 
      // Fallback to single assignment
      else if (dbTask.assigned_to_id && dbTask.assigned_to_id.trim() !== '') {
        assignedToId = String(dbTask.assigned_to_id);
        assignedToIds = [assignedToId];
        
        const assignedUser = userMap.get(assignedToId);
        assignedToName = assignedUser ? (assignedUser.name || assignedUser.email) : 'Assigned User';
        assignedToNames = [assignedToName];
      }

      // Build task with optimized comment processing
      const taskComments = commentsData ? commentsData
        .filter((comment: any) => comment.task_id === dbTask.id)
        .map((comment: any) => ensureTaskCommentComplete({
          id: String(comment.id),
          userId: String(comment.user_id),
          userName: 'User',
          text: String(comment.content),
          createdAt: parseDate(comment.created_at),
        }, user.organization_id)) : [];

      return {
        id: String(dbTask.id || ''),
        userId: String(dbTask.user_id || user.id),
        projectId: dbTask.project_id ? String(dbTask.project_id) : undefined,
        title: String(dbTask.title || ''),
        description: String(dbTask.description || ''),
        deadline: parseDate(dbTask.deadline),
        priority: taskPriority as 'Low' | 'Medium' | 'High',
        status: taskStatus as 'To Do' | 'In Progress' | 'Completed',
        createdAt: parseDate(dbTask.created_at),
        updatedAt: parseDate(dbTask.updated_at),
        assignedToId,
        assignedToName,
        assignedToIds,
        assignedToNames,
        tags: [],
        comments: taskComments,
        cost: dbTask.cost !== null && dbTask.cost !== undefined ? Number(dbTask.cost) : undefined,
        organizationId: user.organization_id
      };
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`fetchTasks: Successfully processed ${transformedTasks.length} PERSONAL tasks (created by user OR assigned to user)`);
    }
    
    setTasks(transformedTasks);
    
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('fetchTasks: Critical error during personal task fetch:', error);
    }
    // Silently handle errors in production
    setTasks([]);
  }
};
