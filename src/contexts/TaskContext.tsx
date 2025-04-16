import React, { createContext, useState, useContext, useEffect } from 'react';
import { Task, Project, TaskStatus, TaskPriority, DailyScore, Comment } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from '@/components/ui/sonner';

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
      const storedTasks = localStorage.getItem(`tasks-${user.id}`);
      const storedProjects = localStorage.getItem(`projects-${user.id}`);
      
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks).map((task: any) => ({
          ...task,
          deadline: new Date(task.deadline),
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        }));
        setTasks(parsedTasks);
      }
      
      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects).map((project: any) => ({
          ...project,
          startDate: new Date(project.startDate),
          endDate: new Date(project.endDate),
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt),
          tasks: project.tasks.map((task: any) => ({
            ...task,
            deadline: new Date(task.deadline),
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
            completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
          })),
        }));
        setProjects(parsedProjects);
      }

      calculateDailyScore();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`tasks-${user.id}`, JSON.stringify(tasks));
      calculateDailyScore();
    }
  }, [tasks, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`projects-${user.id}`, JSON.stringify(projects));
    }
  }, [projects, user]);

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

  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTasks([...tasks, newTask]);
    toast.success('Task created successfully!');
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return { ...task, ...updates, updatedAt: new Date() };
      }
      return task;
    });

    setTasks(updatedTasks);
    
    if (updates.projectId) {
      const updatedProjects = projects.map((project) => {
        if (project.id === updates.projectId) {
          const projectTasks = project.tasks.map((task) => {
            if (task.id === taskId) {
              return { ...task, ...updates, updatedAt: new Date() };
            }
            return task;
          });
          
          const taskExists = projectTasks.some((task) => task.id === taskId);
          if (!taskExists) {
            const taskToAdd = updatedTasks.find((task) => task.id === taskId);
            if (taskToAdd) {
              projectTasks.push(taskToAdd);
            }
          }
          
          return { ...project, tasks: projectTasks };
        }
        return project;
      });
      
      setProjects(updatedProjects);
    }
    
    toast.success('Task updated successfully!');
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        const completedAt = status === 'Completed' ? new Date() : undefined;
        return { ...task, status, completedAt, updatedAt: new Date() };
      }
      return task;
    });

    setTasks(updatedTasks);
    
    const updatedProjects = projects.map((project) => {
      const projectTasks = project.tasks.map((task) => {
        if (task.id === taskId) {
          const completedAt = status === 'Completed' ? new Date() : undefined;
          return { ...task, status, completedAt, updatedAt: new Date() };
        }
        return task;
      });
      
      return { ...project, tasks: projectTasks };
    });
    
    setProjects(updatedProjects);
    
    toast.success(`Task status updated to ${status}!`);
    calculateDailyScore();
  };

  const deleteTask = (taskId: string) => {
    const filteredTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(filteredTasks);
    
    const updatedProjects = projects.map((project) => {
      const projectTasks = project.tasks.filter((task) => task.id !== taskId);
      return { ...project, tasks: projectTasks };
    });
    
    setProjects(updatedProjects);
    
    toast.success('Task deleted successfully!');
  };

  const addProject = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => {
    const newProject: Project = {
      ...project,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: [],
    };

    setProjects([...projects, newProject]);
    toast.success('Project created successfully!');
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    const updatedProjects = projects.map((project) => {
      if (project.id === projectId) {
        return { ...project, ...updates, updatedAt: new Date() };
      }
      return project;
    });

    setProjects(updatedProjects);
    toast.success('Project updated successfully!');
  };

  const deleteProject = (projectId: string) => {
    const filteredProjects = projects.filter((project) => project.id !== projectId);
    setProjects(filteredProjects);
    
    const updatedTasks = tasks.map((task) => {
      if (task.projectId === projectId) {
        return { ...task, projectId: undefined };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    
    toast.success('Project deleted successfully!');
  };

  const assignTaskToProject = (taskId: string, projectId: string) => {
    const taskToAssign = tasks.find((task) => task.id === taskId);
    if (!taskToAssign) return;
    
    updateTask(taskId, { projectId });
    
    const updatedProjects = projects.map((project) => {
      if (project.id === projectId) {
        const taskExists = project.tasks.some((task) => task.id === taskId);
        if (!taskExists) {
          return { 
            ...project, 
            tasks: [...project.tasks, { ...taskToAssign, projectId }],
            updatedAt: new Date()
          };
        }
      }
      return project;
    });
    
    setProjects(updatedProjects);
    toast.success('Task assigned to project successfully!');
  };

  const assignTaskToUser = (taskId: string, userId: string, userName: string) => {
    updateTask(taskId, { assignedToId: userId, assignedToName: userName });
    
    const taskToUpdate = tasks.find((task) => task.id === taskId);
    if (taskToUpdate?.projectId) {
      const updatedProjects = projects.map((project) => {
        if (project.id === taskToUpdate.projectId) {
          const projectTasks = project.tasks.map((task) => {
            if (task.id === taskId) {
              return { ...task, assignedToId: userId, assignedToName: userName };
            }
            return task;
          });
          
          return { ...project, tasks: projectTasks };
        }
        return project;
      });
      
      setProjects(updatedProjects);
    }
    
    toast.success(`Task assigned to ${userName}!`);
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
