
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserInfo } from '../operations/assignment/fetchUserInfo';

export const assignTaskToProject = async (
  taskId: string,
  projectId: string,
  user: { id: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>>
): Promise<void> => {
  try {
    // Find original task to preserve its properties
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) {
      console.error('Task not found for project assignment:', taskId);
      toast.error('Failed to assign task to project: Task not found');
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({ project_id: projectId })
      .eq('id', taskId)
      .select();

    if (error) {
      console.error('Error assigning task to project:', error);
      toast.error('Failed to assign task to project');
      return;
    }

    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, projectId: projectId } : task
      )
    );

    setProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              tasks: [
                ...project.tasks,
                tasks.find((task) => task.id === taskId),
              ],
            }
          : project
      )
    );

    toast.success('Task assigned to project successfully!');
  } catch (error) {
    console.error('Error assigning task to project:', error);
    toast.error('Failed to assign task to project');
  }
};

export const assignTaskToUser = async (
  taskId: string,
  userId: string | undefined,
  userName: string | undefined,
  user: { id: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>>
): Promise<void> => {
  try {
    // Find the original task to preserve its properties
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) {
      console.error('Task not found for user assignment:', taskId);
      toast.error('Failed to assign task to user: Task not found');
      return;
    }

    // If userName is the same as userId or undefined, fetch the name
    if ((userName === userId || !userName) && userId) {
      try {
        const fetchedName = await fetchUserInfo(userId);
        if (fetchedName) {
          userName = fetchedName;
          console.log('Retrieved user name from database:', userName);
        }
      } catch (err) {
        console.error('Error fetching user name:', err);
      }
    }

    console.log('Assigning task to user:', {
      taskId,
      userId: userId || 'unassigned',
      userName: userName || 'unassigned',
      originalAssignment: {
        id: originalTask.assignedToId,
        name: originalTask.assignedToName
      }
    });

    const updateData: any = { 
      updated_at: new Date().toISOString() 
    };
    
    // Only set these fields if they're provided
    if (userId !== undefined) {
      updateData.assigned_to_id = userId || null;
    }
    
    if (userName !== undefined) {
      updateData.assigned_to_name = userName || null;
    }

    // Try to update in both tables to ensure consistency
    let updateError = null;
    
    // Try project_tasks table first
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update(updateData)
        .eq('id', taskId);
        
      if (error) {
        console.error('Error updating project_tasks:', error);
        updateError = error;
      } else {
        console.log('Successfully updated assignment in project_tasks');
      }
    } catch (err) {
      console.error('Exception updating project_tasks:', err);
      updateError = err;
    }
    
    // If project_tasks update failed, try legacy tasks table
    if (updateError) {
      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) {
        console.error('Error updating tasks table:', error);
        toast.error('Failed to assign task to user');
        return;
      }
    }

    // Update local state
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? { 
              ...task, 
              assignedToId: userId, 
              assignedToName: userName,
              updatedAt: new Date()
            }
          : task
      )
    );

    // Update task in projects state if needed
    const projectId = originalTask.projectId;
    if (projectId) {
      setProjects((prevProjects) =>
        prevProjects.map((project) => {
          if (project.id === projectId) {
            return {
              ...project,
              tasks: project.tasks?.map((t) =>
                t.id === taskId
                  ? { 
                      ...t, 
                      assignedToId: userId, 
                      assignedToName: userName,
                      updatedAt: new Date()
                    }
                  : t
              ) || [],
            };
          }
          return project;
        })
      );
    }

    toast.success(userId ? 'Task assigned to user successfully!' : 'Task unassigned successfully!');
  } catch (error) {
    console.error('Error assigning task to user:', error);
    toast.error('Failed to assign task to user');
  }
};
