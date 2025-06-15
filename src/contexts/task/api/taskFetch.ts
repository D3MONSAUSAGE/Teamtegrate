
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
    console.log('fetchTasks: Starting STRICT RLS-secured task fetch for user:', { 
      id: user?.id, 
      organizationId: user?.organization_id,
      role: user?.role 
    });
    
    if (!user) {
      console.error('fetchTasks: User is required for this operation');
      toast.error('User must be logged in to view tasks');
      return;
    }
    
    if (!user.organization_id) {
      console.error('fetchTasks: User must belong to an organization');
      toast.error('User must belong to an organization to view tasks');
      return;
    }
    
    // Clear any cached data first
    localStorage.removeItem('tasks-cache');
    sessionStorage.clear();
    
    // Fetch tasks with STRICT RLS policies - will only return directly assigned or created tasks
    console.log('fetchTasks: Executing STRICT RLS-secured tasks query...');
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('fetchTasks: RLS Policy Error fetching tasks:', tasksError);
      toast.error('Failed to load authorized tasks: ' + tasksError.message);
      return;
    }

    console.log(`fetchTasks: STRICT RLS returned ${tasksData?.length || 0} directly accessible tasks from database for user ${user.id} (${user.role})`);
    
    // Security validation: Ensure all returned tasks should be accessible by this user
    const validatedTasks = tasksData?.filter(dbTask => {
      // Check organization match
      if (dbTask.organization_id !== user.organization_id) {
        console.error('fetchTasks: SECURITY VIOLATION - Task from different organization leaked:', {
          taskId: dbTask.id,
          taskOrg: dbTask.organization_id,
          userOrg: user.organization_id
        });
        return false;
      }

      // Check if user should have access to this task
      const hasDirectAccess = 
        dbTask.user_id === user.id || // Task creator
        dbTask.assigned_to_id === user.id || // Single assignee
        (dbTask.assigned_to_ids && dbTask.assigned_to_ids.includes(user.id)) || // Multi assignee
        user.role === 'admin' || user.role === 'superadmin'; // Admin access

      if (!hasDirectAccess) {
        console.error('fetchTasks: SECURITY VIOLATION - User should not have access to this task:', {
          taskId: dbTask.id,
          userId: user.id,
          userRole: user.role,
          taskCreator: dbTask.user_id,
          taskAssignedTo: dbTask.assigned_to_id,
          taskAssignedToIds: dbTask.assigned_to_ids
        });
        return false;
      }

      return true;
    }) || [];

    console.log(`fetchTasks: Security validation passed for ${validatedTasks.length} STRICTLY accessible tasks`);
    
    // Fetch comments with explicit column selection (only from same organization)
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('id, user_id, task_id, content, created_at')
      .eq('organization_id', user.organization_id);

    if (commentsError) {
      console.error('fetchTasks: Error fetching comments:', commentsError);
    }

    // Fetch user information for proper assignee display (only from same organization)
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('organization_id', user.organization_id);

    if (usersError) {
      console.error('fetchTasks: Error fetching organization users:', usersError);
    }

    // Create user lookup map
    const userMap = new Map();
    if (usersData) {
      usersData.forEach((userData: any) => {
        userMap.set(userData.id, userData);
      });
    }

    // Transform tasks with enhanced security logging
    const transformedTasks: Task[] = [];
    
    if (validatedTasks.length > 0) {
      for (const dbTask of validatedTasks) {
        const accessReason = 
          dbTask.user_id === user.id ? 'CREATOR' :
          dbTask.assigned_to_id === user.id ? 'SINGLE_ASSIGNEE' :
          (dbTask.assigned_to_ids && dbTask.assigned_to_ids.includes(user.id)) ? 'MULTI_ASSIGNEE' :
          user.role === 'admin' || user.role === 'superadmin' ? 'ADMIN_ACCESS' : 'UNKNOWN';

        console.log('fetchTasks: Processing STRICTLY authorized task:', {
          taskId: dbTask.id,
          taskTitle: dbTask.title,
          assignedTo: dbTask.assigned_to_id,
          projectId: dbTask.project_id,
          userId: user.id,
          userRole: user.role,
          accessReason: accessReason
        });
        
        // Explicit type validation
        let taskPriority: 'Low' | 'Medium' | 'High' = 'Medium';
        if (dbTask.priority === 'Low' || dbTask.priority === 'Medium' || dbTask.priority === 'High') {
          taskPriority = dbTask.priority;
        }
        
        let taskStatus: 'To Do' | 'In Progress' | 'Completed' = 'To Do';
        if (dbTask.status === 'To Do' || dbTask.status === 'In Progress' || dbTask.status === 'Completed') {
          taskStatus = dbTask.status;
        }

        // Handle assignment data with proper normalization
        let assignedToId: string | undefined;
        let assignedToName: string | undefined;
        let assignedToIds: string[] = [];
        let assignedToNames: string[] = [];

        // Priority: Use assigned_to_ids if available (normalized data)
        if (dbTask.assigned_to_ids && Array.isArray(dbTask.assigned_to_ids) && dbTask.assigned_to_ids.length > 0) {
          assignedToIds = dbTask.assigned_to_ids.map((id: any) => String(id));
          
          // Get names from assigned_to_names or fallback to user lookup
          if (dbTask.assigned_to_names && Array.isArray(dbTask.assigned_to_names) && dbTask.assigned_to_names.length > 0) {
            assignedToNames = dbTask.assigned_to_names.map((name: any) => String(name));
          } else {
            // Fallback to user lookup for names
            assignedToNames = assignedToIds.map(id => {
              const assignedUser = userMap.get(id);
              return assignedUser ? (assignedUser.name || assignedUser.email) : 'Unknown User';
            });
          }

          // For single assignment, also populate single fields for backward compatibility
          if (assignedToIds.length === 1) {
            assignedToId = assignedToIds[0];
            assignedToName = assignedToNames[0];
          }
        } 
        // Fallback: Use assigned_to_id if no assigned_to_ids (legacy data)
        else if (dbTask.assigned_to_id && dbTask.assigned_to_id.trim() !== '') {
          assignedToId = String(dbTask.assigned_to_id);
          assignedToIds = [assignedToId];
          
          // Get name from user lookup
          const assignedUser = userMap.get(assignedToId);
          assignedToName = assignedUser ? (assignedUser.name || assignedUser.email) : 'Assigned User';
          assignedToNames = [assignedToName];
        }

        // Build task with explicit type annotations and proper assignee data
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
          assignedToId,
          assignedToName,
          assignedToIds,
          assignedToNames,
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
    }

    console.log(`fetchTasks: Successfully processed ${transformedTasks.length} STRICTLY authorized tasks for user ${user.id} (${user.role})`);
    
    // Additional security log
    console.log('fetchTasks: Final STRICT security summary:', {
      userId: user.id,
      userRole: user.role,
      userOrg: user.organization_id,
      tasksReturned: transformedTasks.length,
      accessType: 'STRICT_RLS_ONLY_ASSIGNED_OR_CREATED',
      timestamp: new Date().toISOString()
    });
    
    setTasks(transformedTasks);
    
  } catch (error: any) {
    console.error('fetchTasks: Critical error during STRICT RLS-secured task fetch:', error);
    toast.error('Failed to load authorized tasks: ' + error.message);
    setTasks([]);
  }
};
