
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

const parseDate = (dateStr: string | null): Date => {
  if (!dateStr) return new Date();
  return new Date(dateStr);
};

export const fetchTasks = async (
  user: { id: string },
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
): Promise<void> => {
  try {
    // Fetch tasks from supabase
    const { data: taskData, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      return;
    }

    // Fetch comments for all tasks
    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .select('*');

    if (commentError) {
      console.error('Error fetching comments:', commentError);
    }

    // Map tasks with their comments
    const tasks: Task[] = taskData.map((task) => {
      const taskComments = commentData
        ? commentData
            .filter(comment => comment.task_id === task.id)
            .map(comment => ({
              id: comment.id,
              userId: comment.user_id,
              userName: comment.user_id,
              text: comment.content,
              createdAt: parseDate(comment.created_at)
            }))
        : [];

      return {
        id: task.id,
        userId: task.user_id,
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
        assignedToName: task.assigned_to_id,
        comments: taskComments,
        cost: task.cost || 0
      };
    });

    if (commentData && commentData.length > 0) {
      const userIds = [...new Set(commentData.map(comment => comment.user_id))];
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);
      
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

    setTasks(tasks);
  } catch (error) {
    console.error('Error in fetchTasks:', error);
    toast.error('Failed to load tasks');
  }
};
