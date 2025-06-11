
import { Task, User, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const addTask = async (
  taskData: any,
  user: User,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
): Promise<void> => {
  try {
    if (!user?.organizationId) {
      toast.error('Organization context required');
      return;
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { error } = await supabase
      .from('tasks')
      .insert([{
        id: taskId,
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: 'To Do',
        deadline: new Date(taskData.deadline).toISOString(),
        user_id: user.id,
        project_id: taskData.projectId === "none" ? null : taskData.projectId,
        assigned_to_id: taskData.assignedToId || null,
        assigned_to_ids: taskData.assignedToIds || [],
        assigned_to_names: taskData.assignedToNames || [],
        cost: taskData.cost || 0,
        organization_id: user.organizationId
      }]);

    if (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
      return;
    }

    const newTask: Task = {
      id: taskId,
      userId: user.id,
      projectId: taskData.projectId === "none" ? undefined : taskData.projectId,
      title: taskData.title,
      description: taskData.description,
      deadline: new Date(taskData.deadline),
      priority: taskData.priority,
      status: 'To Do',
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedToId: taskData.assignedToId,
      assignedToName: taskData.assignedToName,
      assignedToIds: taskData.assignedToIds,
      assignedToNames: taskData.assignedToNames,
      comments: [],
      cost: taskData.cost || 0,
      organizationId: user.organizationId
    };

    setTasks(prev => [newTask, ...prev]);

    // Update project tasks count if task is assigned to a project
    if (newTask.projectId) {
      const project = projects.find(p => p.id === newTask.projectId);
      if (project) {
        setProjects(prevProjects =>
          prevProjects.map(p =>
            p.id === newTask.projectId
              ? { ...p, tasksCount: p.tasksCount + 1 }
              : p
          )
        );
      }
    }

    toast.success('Task created successfully!');
  } catch (error) {
    console.error('Error adding task:', error);
    toast.error('Failed to create task');
  }
};
