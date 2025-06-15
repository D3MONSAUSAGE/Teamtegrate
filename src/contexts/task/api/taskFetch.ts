
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
    console.log('fetchTasks: Starting task fetch for user:', { 
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
    
    // Fetch tasks with new RLS policies - will only return authorized tasks
    console.log('fetchTasks: Executing tasks query with new RLS policies...');
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('fetchTasks: Error fetching tasks:', tasksError);
      toast.error('Failed to load tasks: ' + tasksError.message);
      return;
    }

    console.log(`fetchTasks: Successfully fetched ${tasksData?.length || 0} authorized tasks from database`);
    
    // Fetch comments with explicit column selection
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('id, user_id, task_id, content, created_at');

    if (commentsError) {
      console.error('fetchTasks: Error fetching comments:', commentsError);
    }

    // Fetch user information for proper assignee display
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('organization_id', user.organization_id);

    if (usersError) {
      console.error('fetchTasks: Error fetching users:', usersError);
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
    
    if (tasksData) {
      for (const dbTask of tasksData) {
        console.log('fetchTasks: Processing authorized task:', {
          taskId: dbTask.id,
          taskTitle: dbTask.title,
          assignedTo: dbTask.assigned_to_id,
          projectId: dbTask.project_id
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

    console.log(`fetchTasks: Successfully processed ${transformedTasks.length} authorized tasks for user ${user.id} (${user.role})`);
    setTasks(transformedTasks);
    
  } catch (error: any) {
    console.error('fetchTasks: Critical error during task fetch:', error);
    toast.error('Failed to load tasks: ' + error.message);
    setTasks([]);
  }
};
