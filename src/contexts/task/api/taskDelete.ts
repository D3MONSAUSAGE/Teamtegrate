
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

export const deleteTask = async (
  taskId: string,
  user: { id: string; organizationId?: string; organization_id?: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>> | (() => Promise<void>)
): Promise<void> => {
  try {
    console.log('Deleting task:', taskId, 'for user:', user);
    
    if (!user?.id) {
      console.error('User ID is required for task deletion');
      toast.error('User must be logged in to delete tasks');
      return;
    }

    // Handle both property naming conventions and validate organization
    const organizationId = user.organizationId || user.organization_id;
    
    if (!organizationId) {
      console.error('User must belong to an organization to delete tasks');
      toast.error('User must belong to an organization to delete tasks');
      return;
    }

    console.log(`Attempting to delete task ${taskId} from organization ${organizationId}`);

    // Delete the task from the database with organization check
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error deleting task from database:', error);
      toast.error('Failed to delete task: ' + error.message);
      return;
    }

    console.log(`Task ${taskId} deleted successfully from database`);

    // Update local state - remove from tasks array
    setTasks(prevTasks => {
      const filteredTasks = prevTasks.filter(task => task.id !== taskId);
      console.log(`Removed task from local tasks. Before: ${prevTasks.length}, After: ${filteredTasks.length}`);
      return filteredTasks;
    });

    // Update projects state if task was part of a project
    if (typeof setProjects === 'function' && setProjects.length > 0) {
      setProjects((prevProjects: any[]) =>
        prevProjects.map((project) => ({
          ...project,
          tasks: project.tasks.filter((task: Task) => task.id !== taskId),
        }))
      );
    } else if (typeof setProjects === 'function' && setProjects.length === 0) {
      // It's a refresh function
      try {
        await (setProjects as () => Promise<void>)();
      } catch (error) {
        console.error('Error refreshing projects:', error);
      }
    }

    toast.success('Task deleted successfully!');
  } catch (error) {
    console.error('Error in deleteTask:', error);
    toast.error('Failed to delete task');
  }
};
