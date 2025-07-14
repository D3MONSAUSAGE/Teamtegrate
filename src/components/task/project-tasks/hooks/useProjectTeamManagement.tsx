
import { useCallback } from 'react';
import { Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const useProjectTeamManagement = (
  project: Project | null,
  refetchTeamMembers: () => void
) => {
  const handleAddTeamMember = useCallback(async (userId: string) => {
    if (!project) return;

    try {
      const updatedTeamMemberIds = [...(project.teamMemberIds || []), userId];
      
      const { error } = await supabase
        .from('projects')
        .update({ team_members: updatedTeamMemberIds })
        .eq('id', project.id);

      if (error) throw error;
      
      refetchTeamMembers();
      toast.success('Team member added');
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member');
    }
  }, [project, refetchTeamMembers]);

  const handleRemoveTeamMember = useCallback(async (userId: string) => {
    if (!project) return;

    try {
      const updatedTeamMemberIds = (project.teamMemberIds || []).filter(id => id !== userId);
      
      const { error } = await supabase
        .from('projects')
        .update({ team_members: updatedTeamMemberIds })
        .eq('id', project.id);

      if (error) throw error;
      
      refetchTeamMembers();
      toast.success('Team member removed');
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
    }
  }, [project, refetchTeamMembers]);

  return {
    handleAddTeamMember,
    handleRemoveTeamMember
  };
};
