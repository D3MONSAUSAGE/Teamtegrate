
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { fetchTasks } from './api/taskFetch';

export const fetchUserTasks = async (
  user: { id: string, organization_id?: string },
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
): Promise<void> => {
  try {
    await fetchTasks(user, setTasks);
  } catch (error) {
    console.error('Error in fetchUserTasks:', error);
    toast.error('Failed to load tasks');
  }
};
