import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Task } from '@/types';
import type { ArchiveFilters } from '@/types/archive';

export const useArchivedTasks = (filters?: ArchiveFilters) => {
  const { user } = useAuth();

  const queryFn = async (): Promise<Task[]> => {
    if (!user?.organizationId) return [];

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('organization_id', user.organizationId)
      .eq('is_archived', true)
      .order('archived_at', { ascending: false });

    // Apply filters
    if (filters?.dateFrom) {
      query = query.gte('archived_at', filters.dateFrom.toISOString());
    }

    if (filters?.dateTo) {
      query = query.lte('archived_at', filters.dateTo.toISOString());
    }

    if (filters?.userId) {
      query = query.or(`user_id.eq.${filters.userId},assigned_to_id.eq.${filters.userId}`);
    }

    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching archived tasks:', error);
      throw error;
    }

    // Transform the raw data to Task format
    const transformedTasks: Task[] = (data || []).map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      priority: (task.priority as 'Low' | 'Medium' | 'High') || 'Medium',
      status: (task.status as 'To Do' | 'In Progress' | 'Completed' | 'Archived') || 'Archived',
      deadline: task.deadline ? new Date(task.deadline) : new Date(),
      createdAt: new Date(task.created_at),
      updatedAt: new Date(task.updated_at),
      completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
      archivedAt: task.archived_at ? new Date(task.archived_at) : undefined,
      isArchived: task.is_archived || false,
      userId: task.user_id || '',
      projectId: task.project_id,
      assignedToId: task.assigned_to_id,
      assignedToIds: task.assigned_to_ids || [],
      assignedToNames: task.assigned_to_names || [],
      organizationId: task.organization_id,
      assignedToName: task.assigned_to_names?.[0],
      projectTitle: undefined, // Will be fetched separately if needed
      cost: task.cost || 0
    }));

    return transformedTasks;
  };

  return useQuery({
    queryKey: ['archived-tasks', user?.organizationId, filters],
    queryFn,
    enabled: !!user?.organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};