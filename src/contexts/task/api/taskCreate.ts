
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { playSuccessSound } from '@/utils/sounds';
import { addTask as addTaskOperation } from '../operations/taskAddition';

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
    return;
  }
  
  // Simply forward to our new implementation with the user object properly typed
  await addTaskOperation(
    task, 
    {
      id: user.id,
      email: '', // Not used in the operation
      name: '', // Not used in the operation
      role: 'user', // Not used in the operation
      createdAt: new Date() // Not used in the operation
    }, 
    tasks, 
    setTasks, 
    projects, 
    setProjects
  );
};
