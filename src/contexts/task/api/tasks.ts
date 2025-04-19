
import { User, Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { fetchTeamMemberName } from './team';
import { fetchTaskComments } from './comments';

export const fetchTasks = async (user: User | null, setTasks: React.Dispatch<React.SetStateAction<Task[]>>) => {
  try {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      return;
    }
    
    if (data) {
      // First map tasks to get basic structure
      const tasksWithoutNames = data.map(task => ({
        id: task.id,
        userId: task.user_id,
        projectId: task.project_id,
        title: task.title || '',
        description: task.description || '',
        deadline: new Date(task.deadline || Date.now()),
        priority: (task.priority as any) || 'Medium',
        status: (task.status as any) || 'To Do',
        createdAt: new Date(task.created_at || Date.now()),
        updatedAt: new Date(task.updated_at || Date.now()),
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
        assignedToId: task.assigned_to_id,
        assignedToName: undefined, // We'll fill this in later
        completedById: user.id, // Default to current user if completed
        completedByName: user.name,
        cost: task.cost || 0,
        comments: [] // Initialize as empty array
      }));
      
      // Now process additional data in parallel for all tasks
      const formattedTasksWithPromises = await Promise.all(tasksWithoutNames.map(async (task) => {
        // Get assignee name if there is an assignedToId
        if (task.assignedToId) {
          task.assignedToName = await fetchTeamMemberName(task.assignedToId);
        }
        
        // Fetch comments for each task
        const comments = await fetchTaskComments(task.id);
        if (comments) {
          task.comments = comments;
        }
        
        return task;
      }));
      
      setTasks(formattedTasksWithPromises);
    }
  } catch (error) {
    console.error('Error in fetchTasks:', error);
  }
};

