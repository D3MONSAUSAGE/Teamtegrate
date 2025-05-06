
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound } from '@/utils/sounds';
import { addTask as addTaskOperation } from '../operations/taskAddition';

/**
 * Normalizes a user object or ID to ensure consistent format
 */
const normalizeUser = (user: { id: string } | null): { 
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
} | null => {
  if (!user) return null;
  
  // Ensure user.id is a string
  const userId = typeof user.id === 'string' ? user.id : String(user.id);
  
  return {
    id: userId,
    email: '',  // Not used in the operation
    name: '',   // Not used in the operation
    role: 'user', // Not used in the operation
    createdAt: new Date() // Not used in the operation
  };
};

export const addTask = async (
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  user: { id: string } | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>>
): Promise<void> => {
  if (!user) {
    console.error('Cannot add task: No user provided');
    toast.error('User information required');
    return;
  }
  
  // Normalize the user object to ensure consistent format
  const normalizedUser = normalizeUser(user);
  
  // Forward to our implementation with the properly typed user object
  await addTaskOperation(
    task, 
    normalizedUser,
    tasks, 
    setTasks, 
    projects, 
    setProjects
  );
};
