
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

    // Find the task
    const task = tasks.find(t => t.id === taskId);
    const projectId = task?.projectId;
    
    // Update local tasks state
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        return { 
          ...task, 
          status, 
          updatedAt: now,
          completedAt: status === 'Completed' ? now : undefined
        };
      }
      return task;
    }));

    // Also update the task in the project and check if all tasks are completed
    if (projectId) {
      // Find the project for this task
      const project = projects.find(p => p.id === projectId);
      
      if (project) {
        // Get updated tasks for this project after this change
        const updatedProjectTasks = [...tasks.filter(t => t.projectId === projectId && t.id !== taskId), 
          {...task!, status, updatedAt: now, completedAt: status === 'Completed' ? now : undefined}];
        
        // Check if all tasks are now completed
        const allTasksCompleted = 
          updatedProjectTasks.length > 0 && 
          updatedProjectTasks.every(t => t.status === 'Completed');
        
        // If all tasks are completed, update the project status too
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
          }
          
          // Update local state for projects
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
        } else {
          // Just update the task in the project
          setProjects(prevProjects => {
            return prevProjects.map(project => {
              if (project.id === projectId) {
                return {
                  ...project,
                  tasks: project.tasks.map(projectTask => {
                    if (projectTask.id === taskId) {
                      return {
                        ...projectTask,
                        status,
                        updatedAt: now,
                        completedAt: status === 'Completed' ? now : undefined
                      };
                    }
                    return projectTask;
                  })
                };
              }
              return project;
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
