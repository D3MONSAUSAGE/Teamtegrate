
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Project, DailyScore } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTasks } from './api/taskFetch';

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  dailyScore: DailyScore;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setDailyScore: React.Dispatch<React.SetStateAction<DailyScore>>;
  refreshTasks: () => Promise<void>;
  isLoading: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyScore, setDailyScore] = useState<DailyScore>({
    completedTasks: 0,
    totalTasks: 0,
    percentage: 0,
    date: new Date(),
  });

  const refreshTasks = async () => {
    if (!user || !user.organization_id) {
      console.log('User or organization not ready for task fetch');
      return;
    }

    setIsLoading(true);
    try {
      await fetchTasks(user, setTasks);
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeTasks = async () => {
      console.log('TaskProvider: Auth loading:', authLoading, 'User:', !!user, 'Org ID:', user?.organization_id);
      
      // Wait for auth to complete and user to have organization_id
      if (authLoading) {
        console.log('TaskProvider: Still loading auth, waiting...');
        return;
      }

      if (!user) {
        console.log('TaskProvider: No user, setting loading to false');
        setIsLoading(false);
        return;
      }

      if (!user.organization_id) {
        console.log('TaskProvider: User has no organization_id, cannot fetch tasks');
        setIsLoading(false);
        return;
      }

      console.log('TaskProvider: Ready to fetch tasks for user:', user.id);
      await refreshTasks();
    };

    initializeTasks();
  }, [user, authLoading]);

  const value: TaskContextType = {
    tasks,
    projects,
    dailyScore,
    setTasks,
    setProjects,
    setDailyScore,
    refreshTasks,
    isLoading,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTask = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};
