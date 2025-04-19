import { playSuccessSound, playErrorSound, playStatusChangeSound } from '@/utils/sounds';
import { User, Project, Task, TaskStatus, TaskPriority, TaskComment, DailyScore } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';
import { updateTaskInProjects } from './utils';
import { fetchTeamMemberName } from './api/team';

export const addTask = async (
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    const now = new Date();
    const taskId = uuidv4();

    console.log('Adding task with project:', task.projectId);

    const taskToInsert = {
      id: taskId,
      user_id: user.id,
      project_id: task.projectId || null,
      title: task.title,
      description: task.description,
      deadline: task.deadline.toISOString(),
      priority: task.priority,
      status: task.status,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      assigned_to_id: task.assignedToId || null,
      cost: task.cost || 0
    };

    console.log('Inserting task:', taskToInsert);

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskToInsert)
      .select('*')
      .single();

    if (error) {
      console.error('Error adding task:', error);
      playErrorSound();
      toast.error('Failed to create task');
      return;
    }

    if (data) {
      // Fetch assignee name if needed
      let assigneeName = task.assignedToName;
      if (data.assigned_to_id && !assigneeName) {
        assigneeName = await fetchTeamMemberName(data.assigned_to_id);
      }
      
      const newTask: Task = {
        id: data.id,
        userId: data.user_id,
        projectId: data.project_id || undefined,
        title: data.title,
        description: data.description,
        deadline: new Date(data.deadline),
        priority: data.priority as TaskPriority,
        status: data.status as TaskStatus,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        assignedToId: data.assigned_to_id || undefined,
        assignedToName: assigneeName,
        tags: [],
        comments: [],
        cost: data.cost || 0
      };

      // Add the task to the tasks array
      setTasks(prevTasks => [...prevTasks, newTask]);
      
      // If task has a projectId, update the projects state to include this task
      if (task.projectId) {
        setProjects(prevProjects => prevProjects.map(project => {
          if (project.id === task.projectId) {
            return {
              ...project,
              tasks: [...(project.tasks || []), newTask]
            };
          }
          return project;
        }));
      }

      playSuccessSound();
      toast.success('Task created successfully!');
    }
  } catch (error) {
    console.error('Error in addTask:', error);
    playErrorSound();
    toast.error('Failed to create task');
  }
};

export const updateTask = async (
  taskId: string,
  updates: Partial<Task>,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    const now = new Date();
    const updatedFields: any = {
      updated_at: now.toISOString()
    };

    if (updates.title !== undefined) updatedFields.title = updates.title;
    if (updates.description !== undefined) updatedFields.description = updates.description;
    if (updates.deadline !== undefined) updatedFields.deadline = (updates.deadline instanceof Date ? updates.deadline : new Date(updates.deadline)).toISOString();
    if (updates.priority !== undefined) updatedFields.priority = updates.priority;
    if (updates.status !== undefined) updatedFields.status = updates.status;
    if (updates.projectId !== undefined) updatedFields.project_id = updates.projectId;
    if (updates.assignedToId !== undefined) updatedFields.assigned_to_id = updates.assignedToId;
    if (updates.cost !== undefined) updatedFields.cost = updates.cost;

    console.log('Updating task with fields:', updatedFields);

    const { error } = await supabase
      .from('tasks')
      .update(updatedFields)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      playErrorSound();
      toast.error('Failed to update task');
      return;
    }

    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        return { ...task, ...updates, updatedAt: now };
      }
      return task;
    }));

    // Update tasks in projects too if needed
    if (updates) {
      updateTaskInProjects(projects, setProjects, taskId, updates);
    }

    toast.success('Task updated successfully!');
  } catch (error) {
    console.error('Error in updateTask:', error);
    playErrorSound();
    toast.error('Failed to update task');
  }
};

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

    const { error } = await supabase
      .from('tasks')
      .update({ status, updated_at: now.toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      playErrorSound();
      toast.error('Failed to update task status');
      return;
    }

    setTasks(prevTasks => prevTasks.map(task => 
      task.id === taskId ? { ...task, status } : task
    ));
    playStatusChangeSound();
    toast.success('Task status updated successfully!');
  } catch (error) {
    console.error('Error updating task status:', error);
    playErrorSound();
    toast.error('Failed to update task status');
  }
};

export const deleteTask = async (
  taskId: string,
  user: User | null,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      playErrorSound();
      toast.error('Failed to delete task');
      return;
    }

    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    toast.success('Task deleted successfully!');
  } catch (error) {
    console.error('Error in deleteTask:', error);
    playErrorSound();
    toast.error('Failed to delete task');
  }
};

export const assignTaskToProject = async (
  taskId: string,
  projectId: string,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    const now = new Date();

    console.log(`Assigning task ${taskId} to project ${projectId}`);

    const { error } = await supabase
      .from('tasks')
      .update({ project_id: projectId, updated_at: now.toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error assigning task to project:', error);
      playErrorSound();
      toast.error('Failed to assign task to project');
      return;
    }

    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        return { ...task, projectId, updatedAt: now };
      }
      return task;
    }));

    toast.success('Task assigned to project successfully!');
  } catch (error) {
    console.error('Error in assignTaskToProject:', error);
    playErrorSound();
    toast.error('Failed to assign task to project');
  }
};

export const assignTaskToUser = async (
  taskId: string,
  userId: string,
  userName: string,
  currentUser: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!currentUser) return;
    
    const { error } = await supabase
      .from('tasks')
      .update({ 
        assigned_to_id: userId
      })
      .eq('id', taskId);
    
    if (error) {
      console.error('Error assigning task to user:', error);
      toast.error('Failed to assign task');
      return;
    }
    
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? 
          {
            ...task,
            assignedToId: userId,
            assignedToName: userName
          } :
          task
      )
    );
    
    updateTaskInProjects(
      projects, 
      setProjects, 
      taskId, 
      { assignedToId: userId, assignedToName: userName }
    );
    
    toast.success(`Task assigned to ${userName}`);
  } catch (error) {
    console.error('Error in assignTaskToUser:', error);
  }
};

export const addCommentToTask = async (
  taskId: string,
  comment: { userId: string; userName: string; text: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    const now = new Date();
    const newComment: TaskComment = {
      id: uuidv4(),
      userId: comment.userId,
      userName: comment.userName,
      text: comment.text,
      createdAt: now,
    };

    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        const updatedComments = [...(task.comments || []), newComment];
        return { ...task, comments: updatedComments };
      }
      return task;
    }));

    toast.success('Comment added successfully!');
  } catch (error) {
    console.error('Error in addCommentToTask:', error);
    playErrorSound();
    toast.error('Failed to add comment to task');
  }
};

export const addTagToTask = (
  taskId: string,
  tag: string,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  setTasks(prevTasks => prevTasks.map(task => {
    if (task.id === taskId) {
      const updatedTags = [...(task.tags || []), tag];
      return { ...task, tags: updatedTags };
    }
    return task;
  }));

  toast.success('Tag added to task successfully!');
};

export const removeTagFromTask = (
  taskId: string,
  tag: string,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  setTasks(prevTasks => prevTasks.map(task => {
    if (task.id === taskId && task.tags) {
      const updatedTags = task.tags.filter(t => t !== tag);
      return { ...task, tags: updatedTags };
    }
    return task;
  }));

  toast.success('Tag removed from task successfully!');
};

export const addTagToProject = (
  projectId: string,
  tag: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  setProjects(prevProjects => prevProjects.map(project => {
    if (project.id === projectId) {
      const updatedTags = [...(project.tags || []), tag];
      return { ...project, tags: updatedTags };
    }
    return project;
  }));

  toast.success('Tag added to project successfully!');
};

export const removeTagFromProject = (
  projectId: string,
  tag: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  setProjects(prevProjects => prevProjects.map(project => {
    if (project.id === projectId && project.tags) {
      const updatedTags = project.tags.filter(t => t !== tag);
      return { ...project, tags: updatedTags };
    }
    return project;
  }));

  toast.success('Tag removed from project successfully!');
};
