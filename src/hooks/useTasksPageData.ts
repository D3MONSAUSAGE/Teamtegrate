
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/types';
import { flatTasksToTasks } from '@/utils/typeConversions';
import { toast } from '@/components/ui/sonner';

export const useTasksPageData = () => {
  const { user } = useAuth();

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', user?.organizationId, user?.id],
    queryFn: async (): Promise<Task[]> => {
      if (!user?.organizationId || !user?.id) {
        console.log('useTasksPageData: Missing user data, cannot fetch tasks');
        throw new Error('User must be authenticated and belong to an organization');
      }

      console.log('useTasksPageData: Fetching tasks with STRICT RLS policies for user:', {
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role
      });

      // Fetch tasks using NEW STRICT RLS policies - only directly assigned or created tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('useTasksPageData: Error fetching tasks with strict RLS:', tasksError);
        
        // Enhanced error handling for UUID validation issues
        if (tasksError.message?.includes('invalid input syntax for type uuid')) {
          console.error('useTasksPageData: UUID validation error detected - this should now be fixed with the migration');
          throw new Error('Data validation error. Please refresh the page and try again.');
        }
        
        throw new Error(`Failed to fetch authorized tasks: ${tasksError.message}`);
      }

      console.log(`useTasksPageData: STRICT RLS returned ${tasksData?.length || 0} directly accessible tasks for user ${user.id} (${user.role})`);

      if (!tasksData || tasksData.length === 0) {
        console.log('useTasksPageData: No directly assigned or created tasks found - this is expected with strict RLS');
        return [];
      }

      // Fetch users data for name lookup (only from same organization)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('organization_id', user.organizationId);

      if (usersError) {
        console.error('useTasksPageData: Error fetching organization users:', usersError);
      }

      // Create user lookup map
      const userLookup = new Map();
      if (usersData) {
        usersData.forEach(userData => {
          userLookup.set(userData.id, userData.name || userData.email);
        });
      }

      // Process tasks with STRICT access validation
      const processedTasks = tasksData.map(task => {
        console.log('useTasksPageData: Processing STRICTLY authorized task:', {
          taskId: task.id,
          taskTitle: task.title,
          taskCreator: task.user_id,
          taskAssignedTo: task.assigned_to_id,
          taskAssignedToIds: task.assigned_to_ids,
          currentUserId: user.id,
          userRole: user.role,
          accessReason: task.user_id === user.id ? 'CREATOR' : 
                       task.assigned_to_id === user.id ? 'SINGLE_ASSIGNEE' :
                       (task.assigned_to_ids && task.assigned_to_ids.includes(user.id)) ? 'MULTI_ASSIGNEE' :
                       user.role === 'admin' || user.role === 'superadmin' ? 'ADMIN_ACCESS' : 'UNKNOWN'
        });

        // Security check: Ensure task belongs to user's organization
        if (task.organization_id !== user.organizationId) {
          console.error('useTasksPageData: SECURITY VIOLATION - Task from different organization leaked:', {
            taskId: task.id,
            taskOrg: task.organization_id,
            userOrg: user.organizationId
          });
          return null;
        }

        // Process assignment data with proper validation and fallbacks
        let assignedToId = undefined;
        let assignedToName = undefined;
        let assignedToIds = [];
        let assignedToNames = [];

        // Handle assigned_to_ids array (primary source) with enhanced null/empty checking
        if (task.assigned_to_ids && Array.isArray(task.assigned_to_ids) && task.assigned_to_ids.length > 0) {
          // Filter out null, undefined, and empty strings (should not happen after migration but defensive programming)
          assignedToIds = task.assigned_to_ids
            .filter(id => id && id.toString().trim() !== '')
            .map(id => id.toString());

          if (assignedToIds.length > 0) {
            // Process assigned_to_names array with fallback to user lookup
            if (task.assigned_to_names && Array.isArray(task.assigned_to_names) && task.assigned_to_names.length > 0) {
              assignedToNames = task.assigned_to_names
                .filter(name => name && name.toString().trim() !== '')
                .map(name => name.toString());
            }

            // If we don't have enough names, lookup missing ones
            if (assignedToNames.length < assignedToIds.length) {
              assignedToNames = assignedToIds.map((id, index) => {
                if (index < assignedToNames.length && assignedToNames[index]) {
                  return assignedToNames[index];
                }
                return userLookup.get(id) || 'Unknown User';
              });
            }

            // For single assignment, populate single fields for backward compatibility
            if (assignedToIds.length === 1) {
              assignedToId = assignedToIds[0];
              assignedToName = assignedToNames[0];
            }
          }
        }
        // Fallback to single assignment fields (legacy support) with enhanced validation
        else if (task.assigned_to_id && task.assigned_to_id.toString().trim() !== '') {
          assignedToId = task.assigned_to_id.toString();
          assignedToIds = [assignedToId];
          
          assignedToName = userLookup.get(assignedToId) || 'Assigned User';
          assignedToNames = [assignedToName];
        }

        return {
          id: task.id || 'unknown',
          userId: task.user_id || '',
          projectId: task.project_id,
          title: task.title || 'Untitled Task',
          description: task.description || '',
          deadline: task.deadline ? new Date(task.deadline) : new Date(),
          priority: (task.priority as 'Low' | 'Medium' | 'High') || 'Medium',
          status: (task.status as 'To Do' | 'In Progress' | 'Completed') || 'To Do',
          createdAt: task.created_at ? new Date(task.created_at) : new Date(),
          updatedAt: task.updated_at ? new Date(task.updated_at) : new Date(),
          assignedToId,
          assignedToName,
          assignedToIds,
          assignedToNames,
          cost: Number(task.cost) || 0,
          organizationId: task.organization_id
        };
      }).filter(task => task !== null);

      console.log('useTasksPageData: Successfully processed STRICTLY authorized tasks:', {
        originalCount: tasksData.length,
        processedCount: processedTasks.length,
        userId: user.id,
        role: user.role,
        accessType: 'STRICT_RLS_ONLY_ASSIGNED_OR_CREATED'
      });

      return flatTasksToTasks(processedTasks);
    },
    enabled: !!user?.organizationId && !!user?.id,
    staleTime: 30000, // Cache for 30 seconds instead of 0 for better performance
    gcTime: 300000, // Cache for 5 minutes instead of 0
    retry: (failureCount, error: any) => {
      if (failureCount >= 2) return false;
      if (error.message.includes('organization') || error.message.includes('permission')) return false;
      if (error.message.includes('invalid input syntax for type uuid')) return false; // Don't retry UUID errors
      return true;
    },
  });

  if (error) {
    console.error('useTasksPageData: Tasks query error:', error);
    
    // Enhanced error messages for UUID validation issues
    if (error.message?.includes('invalid input syntax for type uuid')) {
      toast.error('Data validation error. Please refresh the page and try again.');
    } else {
      toast.error(`Failed to load authorized tasks: ${error.message}`);
    }
  }

  return {
    tasks,
    isLoading,
    error
  };
};
