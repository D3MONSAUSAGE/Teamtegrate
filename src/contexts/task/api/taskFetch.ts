
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { fetchTaskData } from './task/fetchTaskData';
import { fetchAllTaskComments } from './task/fetchAllTaskComments';
import { resolveUserNames } from './task/resolveUserNames';
import { logTaskFetchResults } from './task/logTaskFetchResults';
import { executeRpc } from '@/integrations/supabase/rpc';
import { isValid } from 'date-fns';

export const fetchTasks = async (
  user: { id: string },
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
): Promise<void> => {
  try {
    // Ensure user.id is a string
    const userId = typeof user.id === 'string' ? user.id : String(user.id);
    console.log('Fetching tasks for user:', userId);
    
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
  
  try {
    console.log(`Processing ${taskData.length} tasks from database`);
    
    // Fetch comments for all tasks
    const commentData = await fetchAllTaskComments();
    
    // Get all user IDs that are assigned to tasks
    const assignedUserIds = taskData
      .filter(task => task.assigned_to_id)
      .map(task => task.assigned_to_id);
    
    // Remove duplicates and filter out any non-UUID values
    const uniqueUserIds = [...new Set(assignedUserIds.filter(id => {
      // Check if id is a valid UUID-like string
      return id && typeof id === 'string' && 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    }))];
    
    console.log(`Found ${uniqueUserIds.length} unique assigned users with valid UUIDs`);
    
    // Build user name mapping
    const userMap = await resolveUserNames(uniqueUserIds as string[]);
    
    // Process task data with comments and user information
    let tasks: Task[] = taskData.map((task: any) => {
      // Normalize user_id to ensure it's valid
      const normalizedUserId = typeof user.id === 'string' ? user.id : String(user.id);
      
      // Improved date parsing function with better error handling and validation
      const parseDate = (dateStr: string | null): Date => {
        if (!dateStr) return new Date();
        
        try {
          const date = new Date(dateStr);
          
          // Check if date is valid
          if (!isValid(date)) {
            console.warn(`Invalid date string: "${dateStr}", using current date instead`);
            return new Date();
          }
          
          return date;
        } catch (e) {
          console.warn(`Error parsing date: "${dateStr}", using current date instead:`, e);
          return new Date();
        }
      };
      
      // Parse the deadline with validation
      const deadline = task.deadline ? parseDate(task.deadline) : new Date();
      
      // Get task comments
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
      const assignedUserName = task.assigned_to_id ? userMap.get(task.assigned_to_id) : undefined;
  
      return {
        id: task.id,
        userId: normalizedUserId, // Use normalized user ID
        projectId: task.project_id,
        title: task.title || '',
        description: task.description || '',
        deadline: deadline,
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
      const commentUserIds = commentData
        .filter(comment => comment.user_id && typeof comment.user_id === 'string')
        .map(comment => comment.user_id);
      
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
    
    // Log task distribution
    const todayTasks = tasks.filter(task => isToday(new Date(task.deadline)));
    console.log(`Found ${todayTasks.length} tasks scheduled for today. Task titles:`, 
      todayTasks.map(t => t.title));
      
    logTaskFetchResults(tasks);
    console.log('Setting tasks, final count:', tasks.length);
    setTasks(tasks);
  } catch (error) {
    console.error('Error processing task data:', error);
    setTasks([]);
  }
};
