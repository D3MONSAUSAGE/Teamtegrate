
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

    // Now handle the project state updates - do this in a more predictable way
    setProjects(prevProjects => {
      // Create a new array to avoid mutation
      return prevProjects.map(project => {
        // If this is the old project and task was previously assigned to a project
        if (originalProjectId && project.id === originalProjectId) {
          return {
            ...project,
            tasks: project.tasks.filter(t => t.id !== taskId)
          };
        }
        
        // If this is the new project
        if (project.id === projectId) {
          // Check if the task is already in the project
          const taskExists = project.tasks.some(t => t.id === taskId);
          if (!taskExists) {
            return {
              ...project,
              tasks: [...project.tasks, updatedTask]
            };
          }
        }
        
        return project;
      });
    });

    toast.success('Task assigned to project successfully!');
  } catch (error) {
    console.error('Error in assignTaskToProject:', error);
    playErrorSound();
    toast.error('Failed to assign task to project');
  }
};
