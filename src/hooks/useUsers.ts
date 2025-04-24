
import { useState, useEffect } from 'react';
import { AppUser } from '@/types';

export const useUsers = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        // For now, just simulate users
        // In a real app, you would fetch from your API
        const mockUsers: AppUser[] = [
          { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Developer' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Designer' },
          { id: '3', name: 'Alex Johnson', email: 'alex@example.com', role: 'Manager' }
        ];
        
        // Simulate network delay
        setTimeout(() => {
          setUsers(mockUsers);
          setIsLoading(false);
        }, 500);
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return {
    users,
    isLoading,
    error
  };
};
