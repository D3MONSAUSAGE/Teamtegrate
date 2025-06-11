
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { validateUserOrganization } from '@/utils/organizationHelpers';

export const assignTaskToProject = async (
  taskId: string,
  projectId: string,
  user: { id: string; organization_id?: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>>
): Promise<void> => {
  try {
    validateUserOrganization(user);

    const { data, error } = await supabase
      .from('tasks')
      .update({ project_id: projectId })
      .eq('id', taskId)
      .eq('organization_id', user.organization_id)
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
  userId: string,
  userName: string,
  user: { id: string; organization_id?: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>>
): Promise<void> => {
  try {
    validateUserOrganization(user);

    const { data, error } = await supabase
      .from('tasks')
      .update({ assigned_to_id: userId, assigned_to_name: userName })
      .eq('id', taskId)
      .eq('organization_id', user.organization_id)
      .select();

    if (error) {
      console.error('Error assigning task to user:', error);
      toast.error('Failed to assign task to user');
      return;
    }

    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? { ...task, assignedToId: userId, assignedToName: userName }
          : task
      )
    );

    setProjects((prevProjects) =>
      prevProjects.map((project) => ({
        ...project,
        tasks: project.tasks.map((task) =>
          task.id === taskId
            ? { ...task, assignedToId: userId, assignedToName: userName }
            : task
        ),
      }))
    );

    toast.success('Task assigned to user successfully!');
  } catch (error) {
    console.error('Error assigning task to user:', error);
    toast.error('Failed to assign task to user');
  }
};
