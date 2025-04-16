import React, { createContext, useState, useContext, useEffect } from 'react';
import { Task, Project, TaskStatus, TaskPriority, DailyScore, Comment } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  dailyScore: DailyScore;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  assignTaskToProject: (taskId: string, projectId: string) => void;
  assignTaskToUser: (taskId: string, userId: string, userName: string) => void;
  addCommentToTask: (taskId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  addTagToTask: (taskId: string, tag: string) => void;
  removeTagFromTask: (taskId: string, tag: string) => void;
  addTagToProject: (projectId: string, tag: string) => void;
  removeTagFromProject: (projectId: string, tag: string) => void;
  addTeamMemberToProject: (projectId: string, userId: string) => void;
  removeTeamMemberFromProject: (projectId: string, userId: string) => void;
  getTasksWithTag: (tag: string) => Task[];
  getProjectsWithTag: (tag: string) => Project[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByPriority: (priority: TaskPriority) => Task[];
  getTasksByDate: (date: Date) => Task[];
  getOverdueTasks: () => Task[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dailyScore, setDailyScore] = useState<DailyScore>({
    completedTasks: 0,
    totalTasks: 0,
    percentage: 0,
    date: new Date(),
  });

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchProjects();
    } else {
      setTasks([]);
      setProjects([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      calculateDailyScore();
    }
  }, [tasks, user]);

  const fetchTasks = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching tasks:', error);
        toast.error('Failed to load tasks');
        return;
      }
      
      if (data) {
        const formattedTasks = data.map(task => ({
          ...task,
          id: task.id,
          userId: task.user_id,
          projectId: task.project_id,
          title: task.title || '',
          description: task.description || '',
          deadline: new Date(task.deadline || Date.now()),
          priority: (task.priority as TaskPriority) || 'Medium',
          status: (task.status as TaskStatus) || 'To Do',
          createdAt: new Date(task.created_at || Date.now()),
          updatedAt: new Date(task.updated_at || Date.now()),
          completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
          assignedToId: task.assigned_to_id,
        }));
        
        setTasks(formattedTasks);
      }
    } catch (error) {
      console.error('Error in fetchTasks:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('manager_id', user.id);
      
      if (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects');
        return;
      }
      
      if (data) {
        const formattedProjects = await Promise.all(data.map(async (project) => {
          const { data: projectTasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', project.id);
          
          const formattedProjectTasks = projectTasks ? projectTasks.map(task => ({
            ...task,
            id: task.id,
            userId: task.user_id,
            projectId: task.project_id,
            title: task.title || '',
            description: task.description || '',
            deadline: new Date(task.deadline || Date.now()),
            priority: (task.priority as TaskPriority) || 'Medium',
            status: (task.status as TaskStatus) || 'To Do',
            createdAt: new Date(task.created_at || Date.now()),
            updatedAt: new Date(task.updated_at || Date.now()),
            completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
            assignedToId: task.assigned_to_id,
          })) : [];
          
          return {
            id: project.id,
            title: project.title || '',
            description: project.description || '',
            startDate: new Date(project.start_date || Date.now()),
            endDate: new Date(project.end_date || Date.now()),
            managerId: project.manager_id || '',
            createdAt: new Date(project.created_at || Date.now()),
            updatedAt: new Date(project.updated_at || Date.now()),
            tasks: formattedProjectTasks,
            teamMembers: [],
            tags: [],
          };
        }));
        
        setProjects(formattedProjects);
      }
    } catch (error) {
      console.error('Error in fetchProjects:', error);
    }
  };

  const calculateDailyScore = () => {
    if (!tasks.length) {
      setDailyScore({
        completedTasks: 0,
        totalTasks: 0,
        percentage: 0,
        date: new Date(),
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysTasks = tasks.filter((task) => {
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });

    const completed = todaysTasks.filter((task) => task.status === 'Completed').length;
    const total = todaysTasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    setDailyScore({
      completedTasks: completed,
      totalTasks: total,
      percentage,
      date: today,
    });
  };

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!user) return;
      
      const now = new Date();
      const taskId = uuidv4();
      
      const taskToInsert = {
        id: taskId,
        user_id: user.id,
        project_id: task.projectId,
        title: task.title,
        description: task.description,
        deadline: task.deadline.toISOString(),
        priority: task.priority,
        status: task.status,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        assigned_to_id: task.assignedToId
      };
      
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskToInsert)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error adding task:', error);
        toast.error('Failed to create task');
        return;
      }
      
      if (data) {
        const newTask: Task = {
          id: data.id,
          userId: data.user_id,
          projectId: data.project_id,
          title: data.title,
          description: data.description,
          deadline: new Date(data.deadline),
          priority: data.priority as TaskPriority,
          status: data.status as TaskStatus,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          assignedToId: data.assigned_to_id,
          assignedToName: task.assignedToName
        };
        
        setTasks(prevTasks => [...prevTasks, newTask]);
        
        if (task.projectId) {
          setProjects(prevProjects => prevProjects.map(project => {
            if (project.id === task.projectId) {
              return {
                ...project,
                tasks: [...project.tasks, newTask]
              };
            }
            return project;
          }));
        }
        
        toast.success('Task created successfully!');
      }
    } catch (error) {
      console.error('Error in addTask:', error);
      toast.error('Failed to create task');
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      if (!user) return;
      
      const taskToUpdate = tasks.find(t => t.id === taskId);
      if (!taskToUpdate) return;
      
      const now = new Date();
      const updatedFields: any = {
        updated_at: now.toISOString()
      };
      
      if (updates.title !== undefined) updatedFields.title = updates.title;
      if (updates.description !== undefined) updatedFields.description = updates.description;
      if (updates.deadline !== undefined) updatedFields.deadline = updates.deadline.toISOString();
      if (updates.priority !== undefined) updatedFields.priority = updates.priority;
      if (updates.status !== undefined) updatedFields.status = updates.status;
      if (updates.projectId !== undefined) updatedFields.project_id = updates.projectId;
      if (updates.assignedToId !== undefined) updatedFields.assigned_to_id = updates.assignedToId;
      if (updates.completedAt !== undefined) updatedFields.completed_at = updates.completedAt ? updates.completedAt.toISOString() : null;
      
      const { error } = await supabase
        .from('tasks')
        .update(updatedFields)
        .eq('id', taskId);
      
      if (error) {
        console.error('Error updating task:', error);
        toast.error('Failed to update task');
        return;
      }
      
      setTasks(prevTasks => prevTasks.map(task => {
        if (task.id === taskId) {
          return { ...task, ...updates, updatedAt: now };
        }
        return task;
      }));
      
      setProjects(prevProjects => prevProjects.map(project => {
        const projectContainsTask = project.tasks.some(t => t.id === taskId);
        
        if (projectContainsTask || updates.projectId === project.id) {
          const updatedTasks = project.tasks.map(task => {
            if (task.id === taskId) {
              return { ...task, ...updates, updatedAt: now };
            }
            return task;
          });
          
          if (updates.projectId === project.id && !projectContainsTask) {
            const taskToAdd = { ...taskToUpdate, ...updates, updatedAt: now };
            return {
              ...project,
              tasks: [...updatedTasks, taskToAdd]
            };
          }
          
          return {
            ...project,
            tasks: updatedTasks
          };
        } else if (project.id === taskToUpdate.projectId && updates.projectId !== undefined) {
          return {
            ...project,
            tasks: project.tasks.filter(t => t.id !== taskId)
          };
        }
        
        return project;
      }));
      
      toast.success('Task updated successfully!');
    } catch (error) {
      console.error('Error in updateTask:', error);
      toast.error('Failed to update task');
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      if (!user) return;
      
      const now = new Date();
      const completedAt = status === 'Completed' ? now : null;
      
      const { error } = await supabase
        .from('tasks')
        .update({
          status,
          completed_at: completedAt ? completedAt.toISOString() : null,
          updated_at: now.toISOString()
        })
        .eq('id', taskId);
      
      if (error) {
        console.error('Error updating task status:', error);
        toast.error('Failed to update task status');
        return;
      }
      
      setTasks(prevTasks => prevTasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            status,
            completedAt: completedAt || undefined,
            updatedAt: now
          };
        }
        return task;
      }));
      
      setProjects(prevProjects => prevProjects.map(project => {
        return {
          ...project,
          tasks: project.tasks.map(task => {
            if (task.id === taskId) {
              return {
                ...task,
                status,
                completedAt: completedAt || undefined,
                updatedAt: now
              };
            }
            return task;
          })
        };
      }));
      
      toast.success(`Task status updated to ${status}!`);
      calculateDailyScore();
    } catch (error) {
      console.error('Error in updateTaskStatus:', error);
      toast.error('Failed to update task status');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      if (!user) return;
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) {
        console.error('Error deleting task:', error);
        toast.error('Failed to delete task');
        return;
      }
      
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      setProjects(prevProjects => prevProjects.map(project => {
        return {
          ...project,
          tasks: project.tasks.filter(task => task.id !== taskId)
        };
      }));
      
      toast.success('Task deleted successfully!');
    } catch (error) {
      console.error('Error in deleteTask:', error);
      toast.error('Failed to delete task');
    }
  };

  const addProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => {
    try {
      if (!user) return;
      
      const now = new Date();
      const projectId = uuidv4();
      
      const projectToInsert = {
        id: projectId,
        title: project.title,
        description: project.description,
        start_date: project.startDate.toISOString(),
        end_date: project.endDate.toISOString(),
        manager_id: user.id,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };
      
      const { data, error } = await supabase
        .from('projects')
        .insert(projectToInsert)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error adding project:', error);
        toast.error('Failed to create project');
        return;
      }
      
      if (data) {
        const newProject: Project = {
          id: data.id,
          title: data.title,
          description: data.description,
          startDate: new Date(data.start_date),
          endDate: new Date(data.end_date),
          managerId: data.manager_id,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          tasks: [],
          teamMembers: [],
          tags: []
        };
        
        setProjects(prevProjects => [...prevProjects, newProject]);
        toast.success('Project created successfully!');
      }
    } catch (error) {
      console.error('Error in addProject:', error);
      toast.error('Failed to create project');
    }
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      if (!user) return;
      
      const now = new Date();
      const updatedFields: any = {
        updated_at: now.toISOString()
      };
      
      if (updates.title !== undefined) updatedFields.title = updates.title;
      if (updates.description !== undefined) updatedFields.description = updates.description;
      if (updates.startDate !== undefined) updatedFields.start_date = updates.startDate.toISOString();
      if (updates.endDate !== undefined) updatedFields.end_date = updates.endDate.toISOString();
      
      const { error } = await supabase
        .from('projects')
        .update(updatedFields)
        .eq('id', projectId);
      
      if (error) {
        console.error('Error updating project:', error);
        toast.error('Failed to update project');
        return;
      }
      
      setProjects(prevProjects => prevProjects.map(project => {
        if (project.id === projectId) {
          return { ...project, ...updates, updatedAt: now };
        }
        return project;
      }));
      
      toast.success('Project updated successfully!');
    } catch (error) {
      console.error('Error in updateProject:', error);
      toast.error('Failed to update project');
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      if (!user) return;
      
      const projectTasks = tasks.filter(task => task.projectId === projectId);
      for (const task of projectTasks) {
        await supabase
          .from('tasks')
          .update({ project_id: null })
          .eq('id', task.id);
      }
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      if (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project');
        return;
      }
      
      setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
      
      setTasks(prevTasks => prevTasks.map(task => {
        if (task.projectId === projectId) {
          return { ...task, projectId: undefined };
        }
        return task;
      }));
      
      toast.success('Project deleted successfully!');
    } catch (error) {
      console.error('Error in deleteProject:', error);
      toast.error('Failed to delete project');
    }
  };

  const assignTaskToProject = async (taskId: string, projectId: string) => {
    try {
      await updateTask(taskId, { projectId });
    } catch (error) {
      console.error('Error in assignTaskToProject:', error);
    }
  };

  const assignTaskToUser = async (taskId: string, userId: string, userName: string) => {
    try {
      await updateTask(taskId, { assignedToId: userId, assignedToName: userName });
    } catch (error) {
      console.error('Error in assignTaskToUser:', error);
    }
  };

  const addCommentToTask = (taskId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => {
    const newComment: Comment = {
      ...comment,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date(),
    };

    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        const comments = task.comments || [];
        return { 
          ...task, 
          comments: [...comments, newComment],
          updatedAt: new Date() 
        };
      }
      return task;
    });

    setTasks(updatedTasks);
    
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (taskToUpdate?.projectId) {
      const updatedProjects = projects.map((project) => {
        if (project.id === taskToUpdate.projectId) {
          const projectTasks = project.tasks.map((task) => {
            if (task.id === taskId) {
              const comments = task.comments || [];
              return { 
                ...task, 
                comments: [...comments, newComment],
                updatedAt: new Date() 
              };
            }
            return task;
          });
          
          return { ...project, tasks: projectTasks };
        }
        return project;
      });
      
      setProjects(updatedProjects);
    }
    
    toast.success('Comment added successfully!');
  };

  const addTagToTask = (taskId: string, tag: string) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        const tags = task.tags || [];
        if (!tags.includes(tag)) {
          return { 
            ...task, 
            tags: [...tags, tag],
            updatedAt: new Date() 
          };
        }
      }
      return task;
    });

    setTasks(updatedTasks);
    
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (taskToUpdate?.projectId) {
      const updatedProjects = projects.map((project) => {
        if (project.id === taskToUpdate.projectId) {
          const projectTasks = project.tasks.map((task) => {
            if (task.id === taskId) {
              const tags = task.tags || [];
              if (!tags.includes(tag)) {
                return { 
                  ...task, 
                  tags: [...tags, tag],
                  updatedAt: new Date() 
                };
              }
            }
            return task;
          });
          
          return { ...project, tasks: projectTasks };
        }
        return project;
      });
      
      setProjects(updatedProjects);
    }
    
    toast.success('Tag added to task successfully!');
  };

  const removeTagFromTask = (taskId: string, tag: string) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId && task.tags) {
        return { 
          ...task, 
          tags: task.tags.filter(t => t !== tag),
          updatedAt: new Date() 
        };
      }
      return task;
    });

    setTasks(updatedTasks);
    
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (taskToUpdate?.projectId) {
      const updatedProjects = projects.map((project) => {
        if (project.id === taskToUpdate.projectId) {
          const projectTasks = project.tasks.map((task) => {
            if (task.id === taskId && task.tags) {
              return { 
                ...task, 
                tags: task.tags.filter(t => t !== tag),
                updatedAt: new Date() 
              };
            }
            return task;
          });
          
          return { ...project, tasks: projectTasks };
        }
        return project;
      });
      
      setProjects(updatedProjects);
    }
    
    toast.success('Tag removed from task successfully!');
  };

  const addTagToProject = (projectId: string, tag: string) => {
    const updatedProjects = projects.map((project) => {
      if (project.id === projectId) {
        const tags = project.tags || [];
        if (!tags.includes(tag)) {
          return { 
            ...project, 
            tags: [...tags, tag],
            updatedAt: new Date() 
          };
        }
      }
      return project;
    });

    setProjects(updatedProjects);
    toast.success('Tag added to project successfully!');
  };

  const removeTagFromProject = (projectId: string, tag: string) => {
    const updatedProjects = projects.map((project) => {
      if (project.id === projectId && project.tags) {
        return { 
          ...project, 
          tags: project.tags.filter(t => t !== tag),
          updatedAt: new Date() 
        };
      }
      return project;
    });

    setProjects(updatedProjects);
    toast.success('Tag removed from project successfully!');
  };

  const addTeamMemberToProject = (projectId: string, userId: string) => {
    const updatedProjects = projects.map((project) => {
      if (project.id === projectId) {
        const teamMembers = project.teamMembers || [];
        if (!teamMembers.includes(userId)) {
          return { 
            ...project, 
            teamMembers: [...teamMembers, userId],
            updatedAt: new Date() 
          };
        }
      }
      return project;
    });

    setProjects(updatedProjects);
    toast.success('Team member added to project successfully!');
  };

  const removeTeamMemberFromProject = (projectId: string, userId: string) => {
    const updatedProjects = projects.map((project) => {
      if (project.id === projectId && project.teamMembers) {
        return { 
          ...project, 
          teamMembers: project.teamMembers.filter(id => id !== userId),
          updatedAt: new Date() 
        };
      }
      return project;
    });

    setProjects(updatedProjects);
    toast.success('Team member removed from project successfully!');
  };

  const getTasksWithTag = (tag: string) => {
    return tasks.filter(task => task.tags?.includes(tag));
  };

  const getProjectsWithTag = (tag: string) => {
    return projects.filter(project => project.tags?.includes(tag));
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const getTasksByPriority = (priority: TaskPriority) => {
    return tasks.filter(task => task.priority === priority);
  };

  const getTasksByDate = (date: Date) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === targetDate.getTime();
    });
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return tasks.filter(task => 
      task.status !== 'Completed' && new Date(task.deadline) < now
    );
  };

  const value = {
    tasks,
    projects,
    dailyScore,
    addTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    addProject,
    updateProject,
    deleteProject,
    assignTaskToProject,
    assignTaskToUser,
    addCommentToTask,
    addTagToTask,
    removeTagFromTask,
    addTagToProject,
    removeTagFromProject,
    addTeamMemberToProject,
    removeTeamMemberFromProject,
    getTasksWithTag,
    getProjectsWithTag,
    getTasksByStatus,
    getTasksByPriority,
    getTasksByDate,
    getOverdueTasks,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
