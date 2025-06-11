
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

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
    
    // Fetch tasks from database - RLS policies will handle organization filtering
    const { data: taskData, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`user_id.eq.${user.id},assigned_to_id.eq.${user.id},assigned_to_ids.cs.{${user.id}},project_id.in.(select id from projects where manager_id=${user.id} or team_members.cs.{${user.id}})`);

    if (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      return;
    }

    console.log(`Fetched ${taskData.length} tasks from database`);
    
    // Fetch comments for all tasks - RLS will filter by organization
    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .select('*');

    if (commentError) {
      console.error('Error fetching comments:', commentError);
    } else {
      console.log(`Fetched ${commentData?.length || 0} comments from database`);
    }

    // Get all unique user IDs that are assigned to tasks (both single and multiple)
    const assignedUserIds = new Set<string>();
    
    taskData.forEach(task => {
      // Add single assigned user
      if (task.assigned_to_id) {
        assignedUserIds.add(task.assigned_to_id);
      }
      // Add multiple assigned users
      if (task.assigned_to_ids && Array.isArray(task.assigned_to_ids)) {
        task.assigned_to_ids.forEach(id => assignedUserIds.add(id));
      }
    });

    const uniqueUserIds = Array.from(assignedUserIds);
    console.log(`Found ${uniqueUserIds.length} unique assigned users`);
    
    // Fetch user details for assigned users - RLS will filter by organization
    let userMap = new Map();
    if (uniqueUserIds.length > 0) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', uniqueUserIds);

      if (userError) {
        console.error('Error fetching user data for task assignments:', userError);
      } else if (userData) {
        userData.forEach(user => {
          userMap.set(user.id, user.name || user.email);
        });
        console.log(`Loaded ${userData.length} user details`);
      }
    }

    // Map tasks with their comments and resolve assigned user names
    const tasks: Task[] = taskData.map((task) => {
      // Process task comments if any
      const taskComments = commentData
        ? commentData
            .filter(comment => comment.task_id === task.id)
            .map(comment => ({
              id: comment.id,
              userId: comment.user_id,
              userName: comment.user_id, // Will update this later
              text: comment.content,
              createdAt: parseDate(comment.created_at),
              organizationId: user.organization_id
            }))
        : [];

      // Get the assigned user name from our map (single assignment)
      const assignedUserName = task.assigned_to_id ? userMap.get(task.assigned_to_id) : undefined;

      // Get assigned user names for multiple assignments
      const assignedUserNames = task.assigned_to_ids && Array.isArray(task.assigned_to_ids)
        ? task.assigned_to_ids.map(id => userMap.get(id)).filter(Boolean)
        : [];

      // Map DB fields to our Task interface
      return {
        id: task.id,
        userId: task.user_id || user.id,
        projectId: task.project_id || undefined,
        title: task.title || '',
        description: task.description || '',
        deadline: parseDate(task.deadline),
        priority: (task.priority as Task['priority']) || 'Medium',
        status: (task.status || 'To Do') as Task['status'],
        createdAt: parseDate(task.created_at),
        updatedAt: parseDate(task.updated_at),
        completedAt: task.completed_at ? parseDate(task.completed_at) : undefined,
        assignedToId: task.assigned_to_id,
        assignedToName: assignedUserName,
        assignedToIds: task.assigned_to_ids || [],
        assignedToNames: task.assigned_to_names || assignedUserNames,
        comments: taskComments,
        cost: task.cost || 0,
        organizationId: user.organization_id
      };
    });

    // Resolve user names for comments - RLS will filter by organization
    if (commentData && commentData.length > 0) {
      const commentUserIds = [...new Set(commentData.map(comment => comment.user_id))];
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', commentUserIds);
      
      if (userError) {
        console.error('Error fetching user data for comments:', userError);
      } else if (userData) {
        const userMap = new Map();
        userData.forEach(user => {
          userMap.set(user.id, user.name || user.email);
        });
        
        tasks.forEach(task => {
          if (task.comments) {
            task.comments = task.comments.map(comment => ({
              ...comment,
              userName: userMap.get(comment.userId) || comment.userName
            }));
          }
        });
      }
    }

    console.log(`Final task count being set: ${tasks.length}`);
    setTasks(tasks);
  } catch (error) {
    console.error('Error in fetchTasks:', error);
    toast.error('Failed to load tasks');
  }
};
