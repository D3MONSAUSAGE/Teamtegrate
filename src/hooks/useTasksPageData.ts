
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/types';
import { flatTasksToTasks } from '@/utils/typeConversions';
import { toast } from '@/components/ui/sonner';

export const useTasksPageData = () => {
  const { user } = useAuth();

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', user?.organizationId],
    queryFn: async (): Promise<Task[]> => {
      if (!user?.organizationId) {
        throw new Error('User must belong to an organization');
      }

      console.log('Fetching tasks for organization:', user.organizationId);

      // Enhanced query with explicit organization filtering as safety net
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', user.organizationId) // Explicit organization filter
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        console.error('Error details:', {
          message: tasksError.message,
          code: tasksError.code,
          details: tasksError.details,
          hint: tasksError.hint
        });
        throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
      }

      console.log(`Successfully fetched ${tasksData?.length || 0} tasks from database`);

      if (!tasksData || tasksData.length === 0) {
        console.log('No tasks found for organization:', user.organizationId);
        return [];
      }

      // Fetch users data for name lookup fallback
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('organization_id', user.organizationId);

      if (usersError) {
        console.error('Error fetching users for name lookup:', usersError);
      }

      // Create user lookup map
      const userLookup = new Map();
      if (usersData) {
        usersData.forEach(userData => {
          userLookup.set(userData.id, userData.name || userData.email);
        });
      }

      // Convert flat tasks to proper Task objects with enhanced assignment processing
      const processedTasks = tasksData.map(task => {
        console.log('Processing task:', task.id, 'Assignment data:', {
          assigned_to_id: task.assigned_to_id,
          assigned_to_ids: task.assigned_to_ids,
          assigned_to_names: task.assigned_to_names
        });

        // Process assignment data with proper validation and fallbacks
        let assignedToId = undefined;
        let assignedToName = undefined;
        let assignedToIds = [];
        let assignedToNames = [];

        // Handle assigned_to_ids array (primary source)
        if (task.assigned_to_ids && Array.isArray(task.assigned_to_ids) && task.assigned_to_ids.length > 0) {
          // Filter out any null/empty values and convert to strings
          assignedToIds = task.assigned_to_ids
            .filter(id => id && id.toString().trim() !== '')
            .map(id => id.toString());

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
              // Fallback to user lookup
              return userLookup.get(id) || 'Unknown User';
            });
          }

          // For single assignment, populate single fields for backward compatibility
          if (assignedToIds.length === 1) {
            assignedToId = assignedToIds[0];
            assignedToName = assignedToNames[0];
          }

          console.log('Processed multi-assignment:', {
            assignedToIds,
            assignedToNames,
            assignedToId,
            assignedToName
          });
        }
        // Fallback to single assignment fields (legacy support)
        else if (task.assigned_to_id && task.assigned_to_id.toString().trim() !== '') {
          assignedToId = task.assigned_to_id.toString();
          assignedToIds = [assignedToId];
          
          // Try to get name from user lookup
          assignedToName = userLookup.get(assignedToId) || 'Assigned User';
          assignedToNames = [assignedToName];

          console.log('Processed single assignment:', {
            assignedToId,
            assignedToName,
            assignedToIds,
            assignedToNames
          });
        } else {
          console.log('No assignment found for task:', task.id);
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
      });

      console.log('Successfully processed tasks with assignment data:', 
        processedTasks.map(t => ({ 
          id: t.id, 
          title: t.title, 
          assignedToName: t.assignedToName,
          assignedToNames: t.assignedToNames 
        }))
      );

      return flatTasksToTasks(processedTasks);
    },
    enabled: !!user?.organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors, but not for auth/permission errors
      if (failureCount >= 2) return false;
      if (error.message.includes('organization') || error.message.includes('permission')) return false;
      return true;
    },
  });

  if (error) {
    console.error('Tasks query error:', error);
    toast.error(`Failed to load tasks: ${error.message}`);
  }

  return {
    tasks,
    isLoading,
    error
  };
};
