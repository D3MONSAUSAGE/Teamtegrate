
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
    // Transform app Task to database format
    const dbTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: task.userId,
      project_id: task.projectId || null,
      title: task.title,
      description: task.description,
      deadline: task.deadline.toISOString(),
      priority: task.priority,
      status: task.status,
      assigned_to_id: task.assignedToId || null,
      assigned_to_ids: task.assignedToIds || [],
      assigned_to_names: task.assignedToNames || [],
      cost: task.cost || 0,
      organization_id: task.organizationId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([dbTask])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    // Transform back to app format
    return {
      id: data.id,
      userId: data.user_id,
      projectId: data.project_id,
      title: data.title,
      description: data.description,
      deadline: new Date(data.deadline),
      priority: data.priority as Task['priority'],
      status: data.status as Task['status'],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      assignedToId: data.assigned_to_id,
      assignedToName: data.assigned_to_names?.[0],
      assignedToIds: data.assigned_to_ids || [],
      assignedToNames: data.assigned_to_names || [],
      cost: Number(data.cost) || 0,
      organizationId: data.organization_id,
      tags: [],
      comments: []
    };
  } catch (error: any) {
    throw new Error(`Failed to create task: ${error.message}`);
  }
};

export const updateTask = async (taskId: string, task: Partial<Task>): Promise<void> => {
  try {
    // Transform app fields to database fields
    const dbUpdate: any = {};
    
    if (task.userId !== undefined) dbUpdate.user_id = task.userId;
    if (task.projectId !== undefined) dbUpdate.project_id = task.projectId;
    if (task.title !== undefined) dbUpdate.title = task.title;
    if (task.description !== undefined) dbUpdate.description = task.description;
    if (task.deadline !== undefined) dbUpdate.deadline = task.deadline.toISOString();
    if (task.priority !== undefined) dbUpdate.priority = task.priority;
    if (task.status !== undefined) dbUpdate.status = task.status;
    if (task.assignedToId !== undefined) dbUpdate.assigned_to_id = task.assignedToId;
    if (task.assignedToIds !== undefined) dbUpdate.assigned_to_ids = task.assignedToIds;
    if (task.assignedToNames !== undefined) dbUpdate.assigned_to_names = task.assignedToNames;
    if (task.cost !== undefined) dbUpdate.cost = task.cost;
    if (task.organizationId !== undefined) dbUpdate.organization_id = task.organizationId;
    
    dbUpdate.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('tasks')
      .update(dbUpdate)
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
    // Transform app fields to database fields
    const dbUpdate: any = {};
    
    if (updates.status !== undefined) dbUpdate.status = updates.status;
    if (updates.priority !== undefined) dbUpdate.priority = updates.priority;
    if (updates.deadline !== undefined) dbUpdate.deadline = updates.deadline.toISOString();
    
    dbUpdate.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('tasks')
      .update(dbUpdate)
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
      .update({ 
        assigned_to_id: userId, 
        assigned_to_names: [userName],
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to assign task: ${error.message}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to assign task: ${error.message}`);
  }
};
