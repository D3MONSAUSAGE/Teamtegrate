
import { Task } from '@/types';
import { SimpleUser } from '@/types/simplified';
import { toast } from '@/components/ui/sonner';
import { fetchTasks } from './api/taskFetch';

export const fetchUserTasks = async (
  user: { id: string, organizationId?: string, email?: string, role?: string },
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
): Promise<void> => {
  try {
    console.log('fetchUserTasks called with user:', { id: user.id, organizationId: user.organizationId });
    
    // Validate and cast role to proper type
    const validRoles = ['user', 'manager', 'admin', 'superadmin'] as const;
    const userRole = validRoles.includes(user.role as any) ? user.role as 'user' | 'manager' | 'admin' | 'superadmin' : 'user';
    
    // Create a complete SimpleUser object using the correct property names
    const simpleUser: SimpleUser = {
      id: user.id,
      organization_id: user.organizationId || '',
      email: user.email || '',
      role: userRole
    };
    
    console.log('Calling fetchTasks with simpleUser:', simpleUser);
    await fetchTasks(simpleUser, setTasks);
  } catch (error) {
    console.error('Error in fetchUserTasks:', error);
    toast.error('Failed to load tasks');
  }
};
