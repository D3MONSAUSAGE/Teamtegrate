import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Task, Project, User, TaskStatus } from '@/types';
import { getUserOrganizationId } from '@/utils/typeCompatibility';
import { addCommentToTask } from './operations/taskContent';
import { deleteTask } from './operations/taskDeletion';

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: string) => void;
  refreshProjects: () => Promise<void>;
  dailyScore: { completedTasks: number; totalTasks: number; percentage: number; date: Date };
  // Add missing methods
  addTask: (taskData: any) => Promise<void>;
  updateTask: (taskId: string, updates: any) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  assignTaskToUser: (taskId: string, userId: string, userName: string) => void;
  addCommentToTask: (taskId: string, comment: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Calculate daily score
  const dailyScore = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
    
    const completedTasks = todayTasks.filter(task => task.status === 'Completed').length;
    const totalTasks = todayTasks.length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      completedTasks,
      totalTasks,
      percentage,
      date: today
    };
  }, [tasks]);

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
  };

  const updateTaskStatus = (taskId: string, status: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: status as TaskStatus } : t));
  };

  const refreshProjects = async () => {
    // Implementation here
  };

  const addTask = async (taskData: any) => {
    const newTask: Task = {
      id: Math.random().toString(),
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      status: 'To Do',
      deadline: taskData.deadline,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: taskData.userId,
      projectId: taskData.projectId,
      assignedToId: taskData.assignedToId,
      assignedToName: taskData.assignedToName,
      organizationId: taskData.organizationId
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = async (taskId: string, updates: any) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const deleteTaskMethod = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const deleteProject = async (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const assignTaskToUser = (taskId: string, userId: string, userName: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, assignedToId: userId, assignedToName: userName }
        : t
    ));
  };

  const addCommentToTaskMethod = (taskId: string, comment: string) => {
    // Implementation here - for now just a placeholder
    console.log('Adding comment to task:', taskId, comment);
  };

  // Mock data with all required properties
  useEffect(() => {
    const mockProjects: Project[] = [
      {
        id: '1',
        title: 'Mock Project 1',
        description: 'A mock project for testing',
        startDate: new Date(),
        endDate: new Date(),
        managerId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
        teamMemberIds: ['user1', 'user2'],
        budget: 10000,
        budgetSpent: 2500,
        isCompleted: false,
        status: 'In Progress',
        tasksCount: 5,
        tags: ['development', 'testing'],
        organizationId: 'org1'
      }
    ];
    
    setProjects(mockProjects);
  }, []);

  const value: TaskContextType = {
    tasks,
    projects,
    setTasks,
    setProjects,
    updateProject,
    updateTaskStatus,
    refreshProjects,
    dailyScore,
    addTask,
    updateTask,
    deleteTask: deleteTaskMethod,
    deleteProject,
    assignTaskToUser,
    addCommentToTask: addCommentToTaskMethod,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};
