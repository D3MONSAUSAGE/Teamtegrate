
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { fetchTaskData } from './task/fetchTaskData';
import { fetchTaskComments } from './task/fetchTaskComments';
import { resolveUserNames } from './task/resolveUserNames';
import { logTaskFetchResults } from './task/logTaskFetchResults';

export const fetchTasks = async (
  user: { id: string },
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
): Promise<void> => {
  try {
    console.log('Fetching tasks for user:', user.id);
    
    // Fetch base task data
    const taskData = await fetchTaskData();
    if (!taskData) {
      toast.error('Failed to load tasks');
      return;
    }
    
    // Fetch comments for all tasks
    const commentData = await fetchTaskComments();
    
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
        userId: task.user_id || user.id, // Default to current user if not set
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
        cost: task.cost || 0
      };
    });

    // Resolve user names for comments
    if (commentData && commentData.length > 0) {
      const userIds = [...new Set(commentData.map(comment => comment.user_id))];
      const commentUserMap = await resolveUserNames(userIds);
      
      tasks = tasks.map(task => ({
        ...task,
        comments: task.comments?.map(comment => ({
          ...comment,
          userName: commentUserMap.get(comment.userId) || comment.userName
        }))
      }));
    }

    // Log detailed information about the task fetch results
    logTaskFetchResults(tasks);

    setTasks(tasks);
  } catch (error) {
    console.error('Error in fetchTasks:', error);
    toast.error('Failed to load tasks');
  }
};
