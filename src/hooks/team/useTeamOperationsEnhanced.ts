import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const useTeamOperationsEnhanced = () => {
  const queryClient = useQueryClient();

  const assignProjectToTeam = useMutation({
    mutationFn: async ({ projectId, teamId }: { projectId: string; teamId: string }) => {
      const { error } = await supabase
        .from('project_teams')
        .insert({
          project_id: projectId,
          team_id: teamId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-teams'] });
      toast.success('Project assigned to team successfully');
    },
    onError: (error) => {
      console.error('Error assigning project to team:', error);
      toast.error('Failed to assign project to team');
    },
  });

  const removeProjectFromTeam = useMutation({
    mutationFn: async ({ projectId, teamId }: { projectId: string; teamId: string }) => {
      const { error } = await supabase
        .from('project_teams')
        .delete()
        .eq('project_id', projectId)
        .eq('team_id', teamId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-teams'] });
      toast.success('Project removed from team successfully');
    },
    onError: (error) => {
      console.error('Error removing project from team:', error);
      toast.error('Failed to remove project from team');
    },
  });

  const updateTaskTeam = useMutation({
    mutationFn: async ({ taskId, teamId }: { taskId: string; teamId: string | null }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ team_id: teamId })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task team updated successfully');
    },
    onError: (error) => {
      console.error('Error updating task team:', error);
      toast.error('Failed to update task team');
    },
  });

  const updateTransactionTeam = useMutation({
    mutationFn: async ({ transactionId, teamId }: { transactionId: string; teamId: string | null }) => {
      const { error } = await supabase
        .from('transactions')
        .update({ team_id: teamId })
        .eq('id', transactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction team updated successfully');
    },
    onError: (error) => {
      console.error('Error updating transaction team:', error);
      toast.error('Failed to update transaction team');
    },
  });

  return {
    assignProjectToTeam,
    removeProjectFromTeam,
    updateTaskTeam,
    updateTransactionTeam,
  };
};