import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface ArchiveTaskParams {
  taskId: string;
  archive: boolean; // true = archive, false = unarchive
}

export const useTaskArchive = () => {
  const queryClient = useQueryClient();

  const archiveTaskMutation = useMutation({
    mutationFn: async ({ taskId, archive }: ArchiveTaskParams) => {
      const updates = archive 
        ? {
            status: 'Archived' as const,
            is_archived: true,
            archived_at: new Date().toISOString()
          }
        : {
            status: 'Completed' as const,
            is_archived: false,
            archived_at: null
          };

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error(`Error ${archive ? 'archiving' : 'unarchiving'} task:`, error);
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      const action = variables.archive ? 'archived' : 'unarchived';
      toast.success(`Task ${action} successfully`);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['personal-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['archived-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error, variables) => {
      const action = variables.archive ? 'archive' : 'unarchive';
      console.error(`Failed to ${action} task:`, error);
      toast.error(`Failed to ${action} task`);
    },
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: async ({ taskIds, archive }: { taskIds: string[]; archive: boolean }) => {
      const updates = archive 
        ? {
            status: 'Archived' as const,
            is_archived: true,
            archived_at: new Date().toISOString()
          }
        : {
            status: 'Completed' as const,
            is_archived: false,
            archived_at: null
          };

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .in('id', taskIds)
        .select();

      if (error) {
        console.error(`Error bulk ${archive ? 'archiving' : 'unarchiving'} tasks:`, error);
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      const action = variables.archive ? 'archived' : 'unarchived';
      toast.success(`${data?.length || 0} tasks ${action} successfully`);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['personal-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['archived-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error, variables) => {
      const action = variables.archive ? 'archive' : 'unarchive';
      console.error(`Failed to bulk ${action} tasks:`, error);
      toast.error(`Failed to bulk ${action} tasks`);
    },
  });

  return {
    archiveTask: archiveTaskMutation.mutate,
    bulkArchive: bulkArchiveMutation.mutate,
    isArchiving: archiveTaskMutation.isPending,
    isBulkArchiving: bulkArchiveMutation.isPending,
  };
};