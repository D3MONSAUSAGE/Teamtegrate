import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { RecruitmentNote } from '@/types/recruitment';

export const useRecruitmentNotes = (candidateId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['recruitment-notes', candidateId],
    queryFn: async () => {
      if (!user?.organizationId) return [];

      const { data, error } = await supabase
        .from('recruitment_notes')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('organization_id', user.organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RecruitmentNote[];
    },
    enabled: !!user?.organizationId && !!candidateId,
  });

  const createNote = useMutation({
    mutationFn: async (noteData: Omit<RecruitmentNote, 'id' | 'organization_id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.organizationId || !user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('recruitment_notes')
        .insert({
          ...noteData,
          organization_id: user.organizationId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-notes', candidateId] });
      toast.success('Note added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add note');
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RecruitmentNote> & { id: string }) => {
      const { error } = await supabase
        .from('recruitment_notes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-notes', candidateId] });
      toast.success('Note updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update note');
    },
  });

  return {
    notes,
    isLoading,
    createNote: createNote.mutate,
    updateNote: updateNote.mutate,
    isCreating: createNote.isPending,
    isUpdating: updateNote.isPending,
  };
};
