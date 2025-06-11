
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FlatTask, FlatProject, FlatUser } from '@/types/flat';
import { useAuth } from '@/contexts/AuthContext';
import { fetchFlatTasks } from './api/flatTaskFetch';
import { toast } from '@/components/ui/sonner';

interface FlatTaskContextType {
  tasks: FlatTask[];
  projects: FlatProject[];
  setTasks: React.Dispatch<React.SetStateAction<FlatTask[]>>;
  setProjects: React.Dispatch<React.SetStateAction<FlatProject[]>>;
  refreshTasks: () => Promise<void>;
  isLoading: boolean;
}

const FlatTaskContext = createContext<FlatTaskContextType | undefined>(undefined);

export const FlatTaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<FlatTask[]>([]);
  const [projects, setProjects] = useState<FlatProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTasks = async () => {
    if (!user || !user.organization_id) {
      console.log('User or organization not ready for task fetch');
      return;
    }

    setIsLoading(true);
    try {
      // Create flat user object with explicit typing
      const flatUser: FlatUser = {
        id: user.id,
        email: user.email || '',
        role: ['user', 'manager', 'admin', 'superadmin'].includes(user.role) 
          ? user.role as 'user' | 'manager' | 'admin' | 'superadmin' 
          : 'user',
        organization_id: user.organization_id
      };
      
      await fetchFlatTasks(flatUser, setTasks);
    } catch (error) {
      console.error('Error refreshing flat tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeTasks = async () => {
      console.log('FlatTaskProvider: Auth loading:', authLoading, 'User:', !!user, 'Org ID:', user?.organization_id);
      
      if (authLoading) {
        console.log('FlatTaskProvider: Still loading auth, waiting...');
        return;
      }

      if (!user) {
        console.log('FlatTaskProvider: No user, setting loading to false');
        setIsLoading(false);
        return;
      }

      if (!user.organization_id) {
        console.log('FlatTaskProvider: User has no organization_id, cannot fetch tasks');
        setIsLoading(false);
        return;
      }

      console.log('FlatTaskProvider: Ready to fetch tasks for user:', user.id);
      await refreshTasks();
    };

    initializeTasks();
  }, [user, authLoading]);

  const value: FlatTaskContextType = {
    tasks,
    projects,
    setTasks,
    setProjects,
    refreshTasks,
    isLoading,
  };

  return <FlatTaskContext.Provider value={value}>{children}</FlatTaskContext.Provider>;
};

export const useFlatTask = (): FlatTaskContextType => {
  const context = useContext(FlatTaskContext);
  if (context === undefined) {
    throw new Error('useFlatTask must be used within a FlatTaskProvider');
  }
  return context;
};

export default FlatTaskProvider;
