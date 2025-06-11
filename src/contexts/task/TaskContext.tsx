import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Project, User } from '@/types';
import { getUserOrganizationId } from '@/utils/typeCompatibility';

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: string) => void;
  refreshProjects: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    // Implementation here
  };

  const updateTaskStatus = (taskId: string, status: string) => {
    // Implementation here
  };

  const refreshProjects = async () => {
    // Implementation here
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
