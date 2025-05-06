
import { Task, User, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

/**
 * Assign a task to a specific project
 */
export const assignTaskToProject = async (
  taskId: string,
  projectId: string,
  user: User | null,
  allTasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    const now = new Date();

    // Find the task to get its current project ID
    const task = allTasks.find(t => t.id === taskId);
    if (!task) {
      console.error('Task not found:', taskId);
      return;
    }
    
    const originalProjectId = task.projectId;
    console.log(`Assigning task ${taskId} (${task.title}) from project ${originalProjectId || 'none'} to project ${projectId}`);

    // First update the database
    const { error } = await supabase
      .from('tasks')
      .update({ 
        project_id: projectId, 
        updated_at: now.toISOString() 
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error assigning task to project:', error);
      playErrorSound();
      toast.error('Failed to assign task to project');
      return;
    }

    // Create a copy of the task with updated project ID
    const updatedTask = { ...task, projectId, updatedAt: now };
    
    // Update the local state for tasks
    setTasks(prevTasks => prevTasks.map(t => {
      if (t.id === taskId) {
        return updatedTask;
      }
      return t;
    }));

    // Now handle the project state updates
    setProjects(prevProjects => {
      // Create a deep copy to avoid mutation
      const updatedProjects = JSON.parse(JSON.stringify(prevProjects));
      
      // If task was previously assigned to a project, remove it from that project
      if (originalProjectId) {
        const originalProjectIndex = updatedProjects.findIndex(p => p.id === originalProjectId);
        if (originalProjectIndex !== -1) {
          console.log(`Removing task ${taskId} from previous project ${originalProjectId}`);
          updatedProjects[originalProjectIndex].tasks = updatedProjects[originalProjectIndex].tasks?.filter(
            t => t.id !== taskId
          ) || [];
        } else {
          console.warn(`Original project ${originalProjectId} not found in state`);
        }
      }
      
      // Add task to new project
      const newProjectIndex = updatedProjects.findIndex(p => p.id === projectId);
      if (newProjectIndex !== -1) {
        console.log(`Adding task ${taskId} to new project ${projectId}`);
        
        // Ensure tasks array exists
        if (!updatedProjects[newProjectIndex].tasks) {
          updatedProjects[newProjectIndex].tasks = [];
        }
        
        // Check if task already exists in project
        const taskExists = updatedProjects[newProjectIndex].tasks.some(t => t.id === taskId);
        
        if (!taskExists) {
          updatedProjects[newProjectIndex].tasks.push(updatedTask);
        } else {
          console.log(`Task ${taskId} already exists in project ${projectId}, updating it`);
          updatedProjects[newProjectIndex].tasks = updatedProjects[newProjectIndex].tasks.map(t => 
            t.id === taskId ? updatedTask : t
          );
        }
      } else {
        console.warn(`New project ${projectId} not found in state`);
      }
      
      return updatedProjects;
    });

    toast.success('Task assigned to project successfully!');
    playSuccessSound();
  } catch (error) {
    console.error('Error in assignTaskToProject:', error);
    playErrorSound();
    toast.error('Failed to assign task to project');
  }
};
