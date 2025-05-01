
import { Task, User, TaskStatus, DailyScore, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playStatusChangeSound, playErrorSound } from '@/utils/sounds';

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setDailyScore: React.Dispatch<React.SetStateAction<DailyScore>>
) => {
  try {
    if (!user) return;

    const now = new Date();
    const updatedFields: any = {
      status,
      updated_at: now.toISOString()
    };
    
    // If completing the task, set completed_at
    if (status === 'Completed') {
      updatedFields.completed_at = now.toISOString();
    } else {
      // If changing from completed to something else, clear completed_at
      updatedFields.completed_at = null;
    }

    const { error } = await supabase
      .from('tasks')
      .update(updatedFields)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      playErrorSound();
      toast.error('Failed to update task status');
      return;
    }

    // Find the task and its project
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('Task not found:', taskId);
      return;
    }
    
    const projectId = task.projectId;
    
    // Update local tasks state
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === taskId ? { 
          ...t, 
          status, 
          updatedAt: now,
          completedAt: status === 'Completed' ? now : undefined
        } : t
      )
    );

    // If task belongs to a project, update project tasks and check completion status
    if (projectId) {
      // Get all tasks for this project (including the updated one)
      const updatedProjectTasks = tasks
        .filter(t => t.projectId === projectId)
        .map(t => t.id === taskId ? { 
          ...t, 
          status, 
          updatedAt: now,
          completedAt: status === 'Completed' ? now : undefined 
        } : t);
      
      // Check if all tasks are now completed
      const allTasksCompleted = 
        updatedProjectTasks.length > 0 && 
        updatedProjectTasks.every(t => t.status === 'Completed');
      
      // Get the project
      const project = projects.find(p => p.id === projectId);
      
      if (project) {
        console.log(
          `Task ${taskId} updated to ${status}. Project ${projectId} has ${updatedProjectTasks.length} tasks, ` +
          `all completed: ${allTasksCompleted}, current status: ${project.status}`
        );
        
        // If all tasks are completed and project isn't marked as completed, update it
        if (allTasksCompleted && project.status !== 'Completed') {
          console.log(`All tasks completed for project ${projectId}. Updating project status to Completed`);
          
          // Update project in database
          const { error: projectError } = await supabase
            .from('projects')
            .update({
              status: 'Completed',
              is_completed: true,
              updated_at: now.toISOString()
            })
            .eq('id', projectId);
            
          if (projectError) {
            console.error('Error updating project status:', projectError);
          } else {
            console.log(`Project ${projectId} marked as completed in database`);
            
            // Update local projects state
            setProjects(prevProjects => prevProjects.map(p => {
              if (p.id === projectId) {
                return {
                  ...p,
                  status: 'Completed',
                  is_completed: true,
                  updatedAt: now,
                  tasks: updatedProjectTasks
                };
              }
              return p;
            }));
            
            toast.success('All tasks completed! Project marked as Complete.');
          }
        } else {
          // Just update the task in the project
          setProjects(prevProjects => {
            return prevProjects.map(p => {
              if (p.id === projectId) {
                const updatedTasks = p.tasks.map(projectTask => {
                  if (projectTask.id === taskId) {
                    return {
                      ...projectTask,
                      status,
                      updatedAt: now,
                      completedAt: status === 'Completed' ? now : undefined
                    };
                  }
                  return projectTask;
                });
                
                // Calculate completion percentage
                const completedCount = updatedTasks.filter(t => t.status === 'Completed').length;
                const totalCount = updatedTasks.length;
                const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                
                console.log(`Project ${projectId} progress updated: ${progress}% tasks completed`);
                
                return {
                  ...p,
                  tasks: updatedTasks
                };
              }
              return p;
            });
          });
        }
      }
    }

    playStatusChangeSound();
    toast.success('Task status updated successfully!');
  } catch (error) {
    console.error('Error updating task status:', error);
    playErrorSound();
    toast.error('Failed to update task status');
  }
};
