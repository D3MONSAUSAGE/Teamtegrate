
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { fetchTaskData } from './task/fetchTaskData';
import { fetchAllTaskComments } from './task/fetchAllTaskComments';
import { resolveUserNames } from './task/resolveUserNames';
import { logTaskFetchResults } from './task/logTaskFetchResults';

export const fetchTasks = async (
  user: { id: string },
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
): Promise<void> => {
  try {
    console.log('Fetching tasks for user:', user.id);
    
    // Try to fetch directly from the project_tasks table first
    let { data: taskData, error } = await supabase
      .from('project_tasks')
      .select('*');
    
    if (error) {
      console.error('Error fetching from project_tasks:', error);
      
      // Fallback to tasks table if project_tasks fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('tasks')
        .select('*');
        
      if (fallbackError) {
        console.error('Error fetching from tasks table:', fallbackError);
        toast.error('Failed to load tasks from either table');
        return;
      }
      
      console.log('Successfully fetched from fallback tasks table:', fallbackData?.length);
      taskData = fallbackData;
    }
    
    if (!taskData || taskData.length === 0) {
      console.log('No tasks found in database');
      setTasks([]);
      return;
    }
    
    console.log(`Retrieved ${taskData.length} tasks from database:`, taskData);
    
    // Fetch comments for all tasks
    const commentData = await fetchAllTaskComments();
    
    // Get all user IDs that are assigned to tasks to fetch their names
    const assignedUserIds = taskData
      .filter(task => task.assigned_to_id)
      .map(task => task.assigned_to_id);

    // Remove duplicates
    const uniqueUserIds = [...new Set(assignedUserIds)];
    console.log(`Found ${uniqueUserIds.length} unique assigned users`);
    
    // Build user name mapping
    const userMap = await resolveUserNames(uniqueUserIds);
    
    // Process task data with comments and user information
    let tasks: Task[] = taskData.map((task) => {
      const taskComments = commentData
        ? commentData
            .filter(comment => comment.task_id === task.id)
            .map(comment => ({
              id: comment.id,
              userId: comment.user_id,
              userName: comment.user_id,
              text: comment.content,
              createdAt: new Date(comment.created_at || new Date())
            }))
        : [];

      // Get the assigned user name from our map
      const assignedUserName = task.assigned_to_id ? userMap.get(task.assigned_to_id) : undefined;

      const parseDate = (dateStr: string | null): Date => {
        if (!dateStr) return new Date();
        return new Date(dateStr);
      };

      return {
        id: task.id,
        userId: user.id, // Use the current user's ID 
        projectId: task.project_id,
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
        comments: taskComments,
        cost: task.cost || 0,
        tags: []
      };
    });

    // Resolve user names for comments
    if (commentData && commentData.length > 0) {
      // Extract user IDs from comments and ensure they are strings
      const commentUserIds = commentData
        .map(comment => comment.user_id)
        .filter((id): id is string => typeof id === 'string');
      
      // Only proceed if we have valid user IDs
      if (commentUserIds.length > 0) {
        const uniqueCommentUserIds = [...new Set(commentUserIds)];
        const commentUserMap = await resolveUserNames(uniqueCommentUserIds);
        
        tasks = tasks.map(task => ({
          ...task,
          comments: task.comments?.map(comment => ({
            ...comment,
            userName: commentUserMap.get(comment.userId) || comment.userName
          }))
        }));
      }
    }

    // Log detailed information about the task fetch results
    logTaskFetchResults(tasks);

    console.log('Setting tasks, final count:', tasks.length);
    setTasks(tasks);
  } catch (error) {
    console.error('Error in fetchTasks:', error);
    toast.error('Failed to load tasks');
  }
};
