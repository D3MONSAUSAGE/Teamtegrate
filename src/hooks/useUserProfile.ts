import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<Error | null>(null);

  useEffect(() => {
    fetchUserTasks();
  }, [user]);

  const fetchUserTasks = async () => {
    if (!user?.id) return;
    
    try {
      setTasksLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      const tasksWithComments = data?.map(task => ({
        id: task.id,
        userId: task.user_id,
        projectId: task.project_id,
        title: task.title,
        description: task.description,
        deadline: task.deadline, // Keep as string to match Task interface
        priority: task.priority as 'Low' | 'Medium' | 'High',
        status: task.status as 'To Do' | 'In Progress' | 'Completed',
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        assignedTo: task.assigned_to,
        assignedToIds: task.assigned_to_ids,
        assignedToNames: task.assigned_to_names,
        cost: task.cost,
        comments: []
      })) || [];

      setUserTasks(tasksWithComments);
    } catch (error) {
      console.error('Error in fetchUserTasks:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  return {
    userTasks,
    tasksLoading,
    tasksError,
    fetchUserTasks
  };
};
