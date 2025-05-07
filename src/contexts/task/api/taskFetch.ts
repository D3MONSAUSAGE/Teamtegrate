
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { fetchTaskData } from './task/fetchTaskData';
import { fetchAllTaskComments } from './task/fetchAllTaskComments';
import { resolveUserNames, preloadUserNames } from './task/resolveUserNames';
import { logTaskFetchResults } from './task/logTaskFetchResults';
import { executeRpc } from '@/integrations/supabase/rpc';

export const fetchTasks = async (
  user: { id: string },
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
): Promise<void> => {
  try {
    console.log('Fetching tasks for user:', user.id);
    
    // First attempt: Using RPC to bypass RLS policies
    console.log('Attempting to fetch tasks via RPC function...');
    const rpcData = await executeRpc('get_all_tasks');
    
    if (rpcData !== null && Array.isArray(rpcData) && rpcData.length > 0) {
      console.log(`RPC returned task data successfully: ${rpcData.length} tasks found`);
      await processAndSetTasks(rpcData, user, setTasks);
      return;
    }
    
    console.log('RPC fetch returned no data or failed, trying direct query...');
    
    // Second attempt: Direct query to project_tasks table
    const { data: directData, error: directError } = await supabase
      .from('project_tasks')
      .select('*');
    
    if (directError) {
      console.error('Direct project_tasks query failed:', directError);
      toast.error('Failed to load tasks from project_tasks table');
    } else if (directData && Array.isArray(directData) && directData.length > 0) {
      console.log(`Retrieved ${directData.length} tasks from direct project_tasks query`);
      await processAndSetTasks(directData, user, setTasks);
      return;
    } else {
      console.log('No tasks found in project_tasks table, trying legacy tasks table...');
    }
    
    // Third attempt: Try legacy tasks table as last resort
    const { data: legacyData, error: legacyError } = await supabase
      .from('tasks')
      .select('*');
      
    if (legacyError) {
      console.error('Legacy tasks fetch failed:', legacyError);
      toast.error('Failed to load tasks. Please check database permissions.');
      setTasks([]);
      return;
    }
    
    if (legacyData && Array.isArray(legacyData) && legacyData.length > 0) {
      console.log(`Retrieved ${legacyData.length} tasks from legacy table`);
      await processAndSetTasks(legacyData, user, setTasks);
      return;
    }
    
    console.log('No tasks found in any table');
    setTasks([]);
  } catch (error) {
    console.error('Error in fetchTasks:', error);
    toast.error('Failed to load tasks');
    setTasks([]);
  }
};

// Helper function to process tasks data and set state
const processAndSetTasks = async (
  taskData: any[],
  user: { id: string },
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
) => {
  if (!taskData || !Array.isArray(taskData) || taskData.length === 0) {
    console.log('No tasks found in database');
    setTasks([]);
    return;
  }
  
  console.log(`Processing ${taskData.length} tasks from database`);
  
  // Fetch comments for all tasks
  const commentData = await fetchAllTaskComments();
  
  // Get all user IDs that are assigned to tasks to fetch their names
  const assignedUserIds = taskData
    .filter(task => task.assigned_to_id)
    .map(task => task.assigned_to_id);

  // Remove duplicates
  const uniqueUserIds = [...new Set(assignedUserIds.filter(Boolean))];
  console.log(`Found ${uniqueUserIds.length} unique assigned users`);
  
  // Preload user names into cache
  await preloadUserNames(uniqueUserIds as string[]);
  
  // Build user name mapping
  const userMap = await resolveUserNames(uniqueUserIds as string[]);
  
  // Process task data with comments and user information
  let tasks: Task[] = taskData.map((task: any) => {
    // Process task comments
    const taskComments = commentData && Array.isArray(commentData)
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
    let assignedUserName: string | undefined = undefined;
    if (task.assigned_to_id) {
      assignedUserName = userMap.get(task.assigned_to_id);
      
      // Additional check for empty or ID-like assignedToName
      if (!assignedUserName || assignedUserName === 'Unknown User') {
        console.log(`Could not resolve name for user ${task.assigned_to_id} on task ${task.id}, falling back to ID`);
      }
    }

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
      tags: task.tags || []
    };
  });

  // Resolve user names for comments
  if (commentData && Array.isArray(commentData) && commentData.length > 0) {
    // Extract user IDs from comments
    const commentUserIds: string[] = [];
    commentData.forEach(comment => {
      if (comment.user_id && typeof comment.user_id === 'string') {
        commentUserIds.push(comment.user_id);
      }
    });
    
    // Only proceed if we have valid user IDs
    if (commentUserIds.length > 0) {
      const uniqueCommentUserIds = [...new Set(commentUserIds)];
      const commentUserMap = await resolveUserNames(uniqueCommentUserIds);
      
      tasks = tasks.map(task => ({
        ...task,
        comments: task.comments?.map(comment => ({
          ...comment,
          userName: comment.userId && commentUserMap.get(comment.userId) || comment.userName
        }))
      }));
    }
  }

  // Log detailed information about the task fetch results
  logTaskFetchResults(tasks);

  console.log('Setting tasks, final count:', tasks.length);
  setTasks(tasks);
};
