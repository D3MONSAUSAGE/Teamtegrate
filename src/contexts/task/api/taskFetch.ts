
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
    console.log('Fetching tasks for user:', { id: user?.id, organizationId: user?.organization_id });
    
    if (!user) {
      console.error('User is required for this operation');
      toast.error('User must be logged in to view tasks');
      return;
    }
    
    if (!user.organization_id) {
      console.error('User must belong to an organization');
      toast.error('User must belong to an organization to view tasks');
      return;
    }
    
    // Fetch tasks with proper organization filtering
    console.log('Executing tasks query...');
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      toast.error('Failed to load tasks: ' + tasksError.message);
      return;
    }

    console.log(`Fetched ${tasksData?.length || 0} tasks from database:`, tasksData);
    
    // Fetch comments with explicit column selection
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('id, user_id, task_id, content, created_at');

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
    }

    // Fetch user information for proper assignee display
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('organization_id', user.organization_id);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Create user lookup map
    const userMap = new Map();
    if (usersData) {
      usersData.forEach((userData: any) => {
        userMap.set(userData.id, userData);
      });
    }

    // Manual transformation with explicit types and proper assignee handling
    const transformedTasks: Task[] = [];
    
    if (tasksData) {
      for (const dbTask of tasksData) {
        console.log('Processing task:', dbTask);
        
        // Explicit type validation
        let taskPriority: 'Low' | 'Medium' | 'High' = 'Medium';
        if (dbTask.priority === 'Low' || dbTask.priority === 'Medium' || dbTask.priority === 'High') {
          taskPriority = dbTask.priority;
        }
        
        let taskStatus: 'To Do' | 'In Progress' | 'Completed' = 'To Do';
        if (dbTask.status === 'To Do' || dbTask.status === 'In Progress' || dbTask.status === 'Completed') {
          taskStatus = dbTask.status;
        }

        // Handle single assignee with proper user lookup
        let assignedToName = undefined;
        if (dbTask.assigned_to_id) {
          // First try to get name from assigned_to_names array
          if (dbTask.assigned_to_names && dbTask.assigned_to_names.length > 0) {
            assignedToName = dbTask.assigned_to_names[0];
          } else {
            // Fallback to user lookup
            const assignedUser = userMap.get(dbTask.assigned_to_id);
            if (assignedUser) {
              assignedToName = assignedUser.name || assignedUser.email;
            }
          }
        }

        // Handle multiple assignees with proper user lookup
        let assignedToNames: string[] = [];
        let assignedToIds: string[] = [];
        
        if (dbTask.assigned_to_ids && Array.isArray(dbTask.assigned_to_ids) && dbTask.assigned_to_ids.length > 0) {
          assignedToIds = dbTask.assigned_to_ids.map((id: any) => String(id));
          
          // Get names for multiple assignees
          if (dbTask.assigned_to_names && Array.isArray(dbTask.assigned_to_names) && dbTask.assigned_to_names.length > 0) {
            assignedToNames = dbTask.assigned_to_names.map((name: any) => String(name));
          } else {
            // Fallback to user lookup for multiple assignees
            assignedToNames = assignedToIds.map(id => {
              const assignedUser = userMap.get(id);
              return assignedUser ? (assignedUser.name || assignedUser.email) : 'Unknown User';
            });
          }
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
          assignedToId: dbTask.assigned_to_id ? String(dbTask.assigned_to_id) : undefined,
          assignedToName: assignedToName,
          assignedToIds: assignedToIds,
          assignedToNames: assignedToNames,
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

    console.log(`Successfully processed ${transformedTasks.length} tasks for display with assignee info`);
    setTasks(transformedTasks);
  } catch (error) {
    console.error('Error in fetchTasks:', error);
    toast.error('Failed to load tasks');
  }
};
