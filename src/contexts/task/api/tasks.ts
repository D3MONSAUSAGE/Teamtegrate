
import { Task, TaskPriority, TaskStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

// Helper function to convert Supabase date strings to Date objects
const parseDate = (dateStr: string | null): Date => {
  if (!dateStr) return new Date();
  return new Date(dateStr);
};

export const fetchTasks = async (
  user: { id: string },
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
): Promise<void> => {
  try {
    // Fetch tasks from supabase
    const { data: taskData, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      return;
    }

    // Fetch comments for all tasks
    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .select('*');

    if (commentError) {
      console.error('Error fetching comments:', commentError);
    }

    // Map tasks with their comments
    const tasks: Task[] = taskData.map((task) => {
      // Find all comments for this task
      const taskComments = commentData
        ? commentData
            .filter(comment => comment.task_id === task.id)
            .map(comment => ({
              id: comment.id,
              userId: comment.user_id,
              userName: comment.user_id, // We'll update this below if possible
              text: comment.content,
              createdAt: parseDate(comment.created_at)
            }))
        : [];

      return {
        id: task.id,
        userId: task.user_id,
        projectId: task.project_id,
        title: task.title || '',
        description: task.description || '',
        deadline: parseDate(task.deadline),
        priority: (task.priority as TaskPriority) || 'Medium',
        status: (task.status || 'To Do') as TaskStatus, // Explicitly cast to TaskStatus
        createdAt: parseDate(task.created_at),
        updatedAt: parseDate(task.updated_at),
        completedAt: task.completed_at ? parseDate(task.completed_at) : undefined,
        assignedToId: task.assigned_to_id,
        assignedToName: task.assigned_to_id, // Using assigned_to_id since assigned_to_name doesn't exist
        comments: taskComments,
        cost: task.cost || 0
      };
    });

    // If there are comments, fetch user names for each comment
    if (commentData && commentData.length > 0) {
      const userIds = [...new Set(commentData.map(comment => comment.user_id))];
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);
      
      if (userError) {
        console.error('Error fetching user data for comments:', userError);
      } else if (userData) {
        // Create a map of userId to name
        const userMap = new Map();
        userData.forEach(user => {
          userMap.set(user.id, user.name || user.email);
        });
        
        // Update the task comments with user names
        tasks.forEach(task => {
          if (task.comments) {
            task.comments = task.comments.map(comment => ({
              ...comment,
              userName: userMap.get(comment.userId) || comment.userName
            }));
          }
        });
      }
    }

    setTasks(tasks);
  } catch (error) {
    console.error('Error in fetchTasks:', error);
    toast.error('Failed to load tasks');
  }
};

export const addTask = async (
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  user: { id: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>>
): Promise<void> => {
  try {
    const newTask = {
      ...task,
      id: uuidv4(),
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          id: newTask.id,
          user_id: newTask.userId,
          project_id: newTask.projectId,
          title: newTask.title,
          description: newTask.description,
          deadline: newTask.deadline.toISOString(),
          priority: newTask.priority,
          status: newTask.status,
          created_at: newTask.createdAt.toISOString(),
          updated_at: newTask.updatedAt.toISOString(),
          assigned_to_id: newTask.assignedToId,
          assigned_to_name: newTask.assignedToName,
          cost: newTask.cost || 0,
        },
      ])
      .select();

    if (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
      return;
    }

    setTasks([...tasks, newTask]);

    // If the task is added to a project, update the project's tasks as well
    if (newTask.projectId) {
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === newTask.projectId
            ? { ...project, tasks: [...project.tasks, newTask] }
            : project
        )
      );
    }

    toast.success('Task added successfully!');
  } catch (error) {
    console.error('Error adding task:', error);
    toast.error('Failed to add task');
  }
};

export const updateTask = async (
  taskId: string,
  updates: Partial<Task>,
  user: { id: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>>
): Promise<void> => {
  try {
    const updatedTask = {
      ...tasks.find((task) => task.id === taskId),
      ...updates,
      updatedAt: new Date(),
    };

    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: updatedTask.title,
        description: updatedTask.description,
        deadline: updatedTask.deadline.toISOString(),
        priority: updatedTask.priority,
        status: updatedTask.status,
        updated_at: updatedTask.updatedAt.toISOString(),
        assigned_to_id: updatedTask.assignedToId,
        assigned_to_name: updatedTask.assignedToName,
        cost: updatedTask.cost || 0,
      })
      .eq('id', taskId)
      .select();

    if (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      return;
    }

    setTasks(
      tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    );

    // If the task is part of a project, update it there as well
    if (updatedTask.projectId) {
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === updatedTask.projectId
            ? {
                ...project,
                tasks: project.tasks.map((task) =>
                  task.id === taskId ? { ...task, ...updates } : task
                ),
              }
            : project
        )
      );
    }

    toast.success('Task updated successfully!');
  } catch (error) {
    console.error('Error updating task:', error);
    toast.error('Failed to update task');
  }
};

export const updateTaskStatus = async (
  taskId: string,
  status: Task['status'],
  user: { id: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>>,
  setDailyScore: React.Dispatch<React.SetStateAction<{
    completedTasks: number;
    totalTasks: number;
    percentage: number;
    date: Date;
  }>>
): Promise<void> => {
  try {
    const task = tasks.find((task) => task.id === taskId);
    if (!task) {
      console.error('Task not found');
      return;
    }

    const now = new Date();
    const updates: Partial<Task> = {
      status: status,
      completedAt: status === 'Completed' ? now : undefined,
      completedById: status === 'Completed' ? user.id : undefined,
    };

    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: status,
        completed_at: status === 'Completed' ? now.toISOString() : null,
        completed_by_id: status === 'Completed' ? user.id : null,
      })
      .eq('id', taskId)
      .select();

    if (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
      return;
    }

    setTasks(
      tasks.map((t) =>
        t.id === taskId ? { ...t, status: status, completedAt: now } : t
      )
    );

    // Update the task in the projects state as well
    setProjects((prevProjects) =>
      prevProjects.map((project) => ({
        ...project,
        tasks: project.tasks.map((task) =>
          task.id === taskId ? { ...task, status: status, completedAt: now } : task
        ),
      }))
    );

    // Update daily score
    setDailyScore((prevScore) => {
      const today = new Date().toDateString();
      if (prevScore.date.toDateString() === today) {
        const completedTasks =
          status === 'Completed'
            ? prevScore.completedTasks + 1
            : prevScore.completedTasks - 1;
        const totalTasks = prevScore.totalTasks;
        const percentage = (completedTasks / totalTasks) * 100;
        return {
          ...prevScore,
          completedTasks,
          percentage,
        };
      } else {
        return prevScore;
      }
    });

    toast.success('Task status updated successfully!');
  } catch (error) {
    console.error('Error updating task status:', error);
    toast.error('Failed to update task status');
  }
};

export const deleteTask = async (
  taskId: string,
  user: { id: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>>
): Promise<void> => {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      return;
    }

    setTasks(tasks.filter((task) => task.id !== taskId));

    // If the task was part of a project, update the project's tasks as well
    setProjects((prevProjects) =>
      prevProjects.map((project) => ({
        ...project,
        tasks: project.tasks.filter((task) => task.id !== taskId),
      }))
    );

    toast.success('Task deleted successfully!');
  } catch (error) {
    console.error('Error deleting task:', error);
    toast.error('Failed to delete task');
  }
};

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

    // Update the task within the projects state
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
  user: { id: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>>
): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({ assigned_to_id: userId, assigned_to_name: userName })
      .eq('id', taskId)
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

    // Update the task within the projects state
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
