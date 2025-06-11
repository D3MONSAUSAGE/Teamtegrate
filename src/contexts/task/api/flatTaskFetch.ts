
import { supabase } from '@/integrations/supabase/client';
import { FlatTask, FlatUser } from '@/types/flat';
import { TaskStatus } from '@/types';

export const fetchFlatTasks = async (
  user: FlatUser,
  setTasks: React.Dispatch<React.SetStateAction<FlatTask[]>>
) => {
  try {
    console.log('🔄 Fetching tasks for user:', user.id, 'in organization:', user.organization_id);
    
    if (!user.organization_id) {
      console.error('❌ User has no organization_id, cannot fetch tasks');
      setTasks([]);
      return;
    }

    // Fetch tasks with organization filtering - RLS will handle access control
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError);
      throw tasksError;
    }

    if (!tasksData) {
      console.log('📝 No tasks found for organization');
      setTasks([]);
      return;
    }

    console.log(`📊 Found ${tasksData.length} tasks for organization`);

    // Transform database tasks to FlatTask format
    const flatTasks: FlatTask[] = tasksData.map(dbTask => {
      // Ensure status is properly typed
      let taskStatus: TaskStatus = 'To Do';
      if (['To Do', 'In Progress', 'Completed'].includes(dbTask.status)) {
        taskStatus = dbTask.status as TaskStatus;
      }

      return {
        id: String(dbTask.id),
        title: String(dbTask.title || ''),
        description: String(dbTask.description || ''),
        deadline: dbTask.deadline ? new Date(dbTask.deadline) : new Date(),
        priority: dbTask.priority as 'High' | 'Medium' | 'Low',
        status: taskStatus,
        userId: String(dbTask.user_id || ''),
        projectId: dbTask.project_id ? String(dbTask.project_id) : undefined,
        createdAt: dbTask.created_at ? new Date(dbTask.created_at) : new Date(),
        updatedAt: dbTask.updated_at ? new Date(dbTask.updated_at) : new Date(),
        assignedToId: dbTask.assigned_to_id ? String(dbTask.assigned_to_id) : undefined,
        assignedToName: Array.isArray(dbTask.assigned_to_names) && dbTask.assigned_to_names.length > 0 
          ? String(dbTask.assigned_to_names[0]) 
          : undefined,
        assignedToIds: Array.isArray(dbTask.assigned_to_ids) ? dbTask.assigned_to_ids.map(String) : [],
        assignedToNames: Array.isArray(dbTask.assigned_to_names) ? dbTask.assigned_to_names.map(String) : [],
        cost: Number(dbTask.cost) || 0,
        organizationId: String(dbTask.organization_id)
      };
    });

    console.log(`✅ Successfully transformed ${flatTasks.length} tasks`);
    setTasks(flatTasks);

  } catch (error) {
    console.error('❌ Error in fetchFlatTasks:', error);
    setTasks([]);
    throw error;
  }
};
