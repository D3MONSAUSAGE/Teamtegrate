
import { Task, TaskStatus } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { validateUserOrganization } from '@/utils/organizationHelpers';

export const updateTask = async (
  taskId: string,
  updates: Partial<Task>,
  user: { id: string; organization_id?: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>> | (() => Promise<void>)
): Promise<void> => {
  try {
    if (!validateUserOrganization(user)) {
      return;
    }
    
    const existingTask = tasks.find((task) => task.id === taskId);
    if (!existingTask) {
      console.error('Task not found:', taskId);
      toast.error('Failed to update task: Task not found');
      return;
    }

    const now = new Date();
    const updatedTask = {
      ...existingTask,
      ...updates,
      updatedAt: now,
    };

    // Normalize assignment data for consistent storage
    let assignmentData = {};
    
    if (updatedTask.assignedToIds && updatedTask.assignedToIds.length > 0) {
      // We have multi-assignment data
      const isSingleAssignment = updatedTask.assignedToIds.length === 1;
      
      assignmentData = {
        assigned_to_ids: updatedTask.assignedToIds,
        assigned_to_names: updatedTask.assignedToNames || [],
        // For single assignment, also populate single field for backward compatibility
        assigned_to_id: isSingleAssignment ? updatedTask.assignedToIds[0] : null,
      };
    } else if (updatedTask.assignedToId) {
      // Legacy single assignment - normalize to both formats
      assignmentData = {
        assigned_to_id: updatedTask.assignedToId,
        assigned_to_ids: [updatedTask.assignedToId],
        assigned_to_names: updatedTask.assignedToName ? [updatedTask.assignedToName] : [],
      };
    } else {
      // No assignment
      assignmentData = {
        assigned_to_id: null,
        assigned_to_ids: [],
        assigned_to_names: [],
      };
    }
    
    const updatePayload: Record<string, any> = {
      title: updatedTask.title,
      description: updatedTask.description,
      priority: updatedTask.priority,
      status: updatedTask.status,
      updated_at: now.toISOString(),
      cost: updatedTask.cost || 0,
      ...assignmentData,
    };
    
    if (updatedTask.deadline) {
      const deadlineDate = updatedTask.deadline instanceof Date 
        ? updatedTask.deadline 
        : new Date(updatedTask.deadline);
      
      if (!isNaN(deadlineDate.getTime())) {
        updatePayload.deadline = deadlineDate.toISOString();
      }
    }

    console.log('Updating task with normalized assignment data:', updatePayload);

    const { error } = await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .eq('organization_id', user.organization_id!);

    if (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      return;
    }

    setTasks(
      tasks.map((task) => (task.id === taskId ? updatedTask : task))
    );

    if (updatedTask.projectId && typeof setProjects === 'function' && setProjects.length > 0) {
      setProjects((prevProjects: any[]) =>
        prevProjects.map((project) =>
          project.id === updatedTask.projectId
            ? {
                ...project,
                tasks: project.tasks.map((task: Task) =>
                  task.id === taskId ? updatedTask : task
                ),
              }
            : project
        )
      );
    } else if (typeof setProjects === 'function' && setProjects.length === 0) {
      try {
        await (setProjects as () => Promise<void>)();
      } catch (error) {
        console.error('Error refreshing projects:', error);
      }
    }

    toast.success('Task updated successfully!');
  } catch (error) {
    console.error('Error updating task:', error);
    toast.error('Failed to update task');
  }
};

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  user: { id: string; organization_id?: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
): Promise<void> => {
  return updateTask(taskId, { status }, user, tasks, setTasks, [], async () => {});
};
