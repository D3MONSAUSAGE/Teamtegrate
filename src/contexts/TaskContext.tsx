
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Task, Project, TaskStatus, TaskPriority, DailyScore } from '@/types';
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

  // Load tasks and projects from localStorage
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

  // Save tasks and projects to localStorage whenever they change
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
    
    // Also update in projects if the task is part of a project
    if (updates.projectId) {
      const updatedProjects = projects.map((project) => {
        if (project.id === updates.projectId) {
          const projectTasks = project.tasks.map((task) => {
            if (task.id === taskId) {
              return { ...task, ...updates, updatedAt: new Date() };
            }
            return task;
          });
          
          // Check if the task is not already in the project
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
    
    // Also update in projects if the task is part of a project
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
    
    // Also remove from projects if the task is part of a project
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
    
    // Also update tasks that were part of this project
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
    
    // Update the task
    updateTask(taskId, { projectId });
    
    // Add the task to the project
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
    
    // Also update in projects if the task is part of a project
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
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
