
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { fetchTasks } from './api/taskFetch';

export const fetchUserTasks = async (
  user: { id: string, organization_id?: string, email?: string, role?: string },
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
): Promise<void> => {
  try {
    // Create a complete SimpleUser object
    const simpleUser = {
      id: user.id,
      organization_id: user.organization_id || '',
      email: user.email || '',
      role: user.role || 'user'
    };
    
    await fetchTasks(simpleUser, setTasks);
  } catch (error) {
    console.error('Error in fetchUserTasks:', error);
    toast.error('Failed to load tasks');
  }
};
