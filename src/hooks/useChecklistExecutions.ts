import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChecklistExecution, ChecklistExecutionItem } from '@/types/checklist';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useMyChecklistExecutions = (date?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-checklist-executions', date],
    queryFn: async () => {
      if (!user) return [];

      const targetDate = date || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('checklist_executions')
        .select(`
          *,
          checklist:checklists(*),
          assigned_user:users!checklist_executions_assigned_to_user_id_fkey(id, name, email),
          verifier:users!checklist_executions_verified_by_fkey(id, name, email)
        `)
        .eq('assigned_to_user_id', user.id)
        .eq('execution_date', targetDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });
};

export const useChecklistExecutionItems = (executionId: string) => {
  return useQuery({
    queryKey: ['checklist-execution-items', executionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_execution_items')
        .select(`
          *,
          checklist_item:checklist_items(*),
          verifier:users!checklist_execution_items_verified_by_fkey(id, name, email)
        `)
        .eq('execution_id', executionId)
        .order('checklist_item.order_index');

      if (error) throw error;
      return data as any[];
    },
    enabled: !!executionId,
  });
};

export const useChecklistExecutionHistory = (userId?: string, limit = 50) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['checklist-execution-history', targetUserId, limit],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('checklist_executions')
        .select(`
          *,
          checklist:checklists(*),
          assigned_user:users!checklist_executions_assigned_to_user_id_fkey(id, name, email),
          verifier:users!checklist_executions_verified_by_fkey(id, name, email)
        `)
        .eq('assigned_to_user_id', targetUserId)
        .order('execution_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as any[];
    },
    enabled: !!targetUserId,
  });
};

export const useStartChecklistExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (executionId: string) => {
      const { data, error } = await supabase
        .from('checklist_executions')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', executionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-checklist-executions'] });
      toast({
        title: "Started",
        description: "Checklist execution started",
      });
    },
  });
};

export const useCompleteChecklistItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      isCompleted, 
      notes 
    }: { 
      itemId: string; 
      isCompleted: boolean; 
      notes?: string; 
    }) => {
      const { data, error } = await supabase
        .from('checklist_execution_items')
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          notes: notes || null,
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-execution-items'] });
      queryClient.invalidateQueries({ queryKey: ['my-checklist-executions'] });
    },
  });
};

export const useCompleteChecklistExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ executionId, notes }: { executionId: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('checklist_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq('id', executionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-checklist-executions'] });
      queryClient.invalidateQueries({ queryKey: ['checklist-execution-history'] });
      toast({
        title: "Completed",
        description: "Checklist execution completed successfully",
      });
    },
  });
};

export const useVerifyChecklistExecution = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      executionId, 
      verificationScore,
      notes 
    }: { 
      executionId: string; 
      verificationScore: number;
      notes?: string; 
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('checklist_executions')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: user.id,
          verification_score: verificationScore,
          total_score: verificationScore, // Will be calculated by trigger
          notes: notes || null,
        })
        .eq('id', executionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-checklist-executions'] });
      queryClient.invalidateQueries({ queryKey: ['checklist-execution-history'] });
      toast({
        title: "Verified",
        description: "Checklist execution verified successfully",
      });
    },
  });
};