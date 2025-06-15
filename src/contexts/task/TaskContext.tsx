
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Task } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedData } from '@/contexts/UnifiedDataContext';

interface TaskContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  isLoading: boolean;
  refreshTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { tasks: unifiedTasks, isLoadingTasks, refetchTasks } = useUnifiedData();
  const [tasks, setTasks] = useState<Task[]>([]);

  // Sync with unified data
  useEffect(() => {
    setTasks(unifiedTasks);
  }, [unifiedTasks]);

  const refreshTasks = async () => {
    await refetchTasks();
  };

  const value = {
    tasks,
    setTasks,
    isLoading: isLoadingTasks,
    refreshTasks
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
