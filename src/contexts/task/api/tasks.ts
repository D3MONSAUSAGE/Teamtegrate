import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types';

export const fetchTasks = async (organizationId: string): Promise<Task[]> => {
  console.log('🔍 fetchTasks: Starting fetch for organization:', organizationId);
  
  try {
    // Updated query: Let RLS policies handle the filtering completely
    // This will only return tasks the authenticated user has access to
    const { data: tasksData, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ fetchTasks: Supabase error:', error);
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    if (!tasksData || tasksData.length === 0) {
      console.log('📭 fetchTasks: No tasks found or user has no access');
      return [];
    }

    console.log(`📊 fetchTasks: Retrieved ${tasksData.length} tasks (filtered by RLS)`);

    // Fetch users for name lookup
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('organization_id', organizationId);

    if (usersError) {
      console.error('⚠️ fetchTasks: Error fetching users for lookup:', usersError);
    }

    // Create user lookup map
    const userLookup = new Map();
    if (usersData) {
      usersData.forEach(user => {
        userLookup.set(user.id, user.name || user.email);
      });
    }

    // Transform tasks to app format
    const transformedTasks: Task[] = tasksData.map(task => {
      // Handle assignment data
      let assignedToId = undefined;
      let assignedToName = undefined;
      let assignedToIds = [];
      let assignedToNames = [];

      if (task.assigned_to_ids && Array.isArray(task.assigned_to_ids) && task.assigned_to_ids.length > 0) {
        assignedToIds = task.assigned_to_ids
          .filter(id => id && id.toString().trim() !== '')
          .map(id => id.toString());

        if (assignedToIds.length > 0) {
          assignedToNames = assignedToIds.map(id => {
            return userLookup.get(id) || 'Unknown User';
          });

          if (assignedToIds.length === 1) {
            assignedToId = assignedToIds[0];
            assignedToName = assignedToNames[0];
          }
        }
      } else if (task.assigned_to_id && task.assigned_to_id.toString().trim() !== '') {
        assignedToId = task.assigned_to_id.toString();
        assignedToIds = [assignedToId];
        assignedToName = userLookup.get(assignedToId) || 'Assigned User';
        assignedToNames = [assignedToName];
      }

      return {
        id: task.id || 'unknown',
        userId: task.user_id || '',
        projectId: task.project_id,
        title: task.title || 'Untitled Task',
        description: task.description || '',
        deadline: task.deadline ? new Date(task.deadline) : new Date(),
        priority: (task.priority as 'Low' | 'Medium' | 'High') || 'Medium',
        status: (task.status as 'To Do' | 'In Progress' | 'Completed') || 'To Do',
        createdAt: task.created_at ? new Date(task.created_at) : new Date(),
        updatedAt: task.updated_at ? new Date(task.updated_at) : new Date(),
        assignedToId,
        assignedToName,
        assignedToIds,
        assignedToNames,
        cost: Number(task.cost) || 0,
        organizationId: task.organization_id,
        tags: [],
        comments: []
      };
    });

    console.log('✅ fetchTasks: Successfully transformed tasks:', transformedTasks.length);
    return transformedTasks;
  } catch (error: any) {
    console.error('❌ fetchTasks: Unexpected error:', error);
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }
};

export const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    return data as Task;
  } catch (error: any) {
    throw new Error(`Failed to create task: ${error.message}`);
  }
};

export const updateTask = async (taskId: string, task: Partial<Task>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tasks')
      .update(task)
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to update task: ${error.message}`);
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to delete task: ${error.message}`);
  }
};

export const updateTaskStatus = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to update task status: ${error.message}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to update task status: ${error.message}`);
  }
};

export const assignTaskToUser = async (taskId: string, userId: string, userName: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ assignedToId: userId, assignedToName: userName })
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to assign task: ${error.message}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to assign task: ${error.message}`);
  }
};
