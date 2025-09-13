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

      // Generate daily executions for the target date
      const { error: genError } = await supabase.rpc('generate_daily_checklist_executions', {
        target_date: targetDate
      });
      
      if (genError) {
        console.warn('Failed to generate daily executions:', genError);
      }

      // Fetch executions for the user
      const { data, error } = await supabase
        .from('checklist_executions')
        .select(`
          *,
          checklist:checklists(*),
          assigned_user:users!checklist_executions_user_fk(id, name, email),
          verifier:users!checklist_executions_verified_by_fk(id, name, email)
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
          verifier:users!checklist_execution_items_verified_by_fk(id, name, email)
        `)
        .eq('execution_id', executionId)
        .order('checklist_item_id');

      if (error) {
        console.error('Error fetching checklist execution items:', error);
        throw error;
      }
      
      // Sort by the order_index from the joined checklist_item
      const sortedData = data?.sort((a, b) => {
        const orderA = a.checklist_item?.order_index || 0;
        const orderB = b.checklist_item?.order_index || 0;
        return orderA - orderB;
      });
      
      return sortedData as any[];
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
          assigned_user:users!checklist_executions_user_fk(id, name, email),
          verifier:users!checklist_executions_verified_by_fk(id, name, email)
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

export const useVerifyChecklistItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, isVerified, notes }: { 
      itemId: string; 
      isVerified: boolean;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('checklist_execution_items')
        .update({
          is_verified: isVerified,
          verified_by: isVerified ? (await supabase.auth.getUser()).data.user?.id : null,
          verified_at: isVerified ? new Date().toISOString() : null,
          notes: notes || null,
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['checklist-execution-items'] });
      queryClient.invalidateQueries({ queryKey: ['checklist-executions'] });
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

// Manager hook to complete and verify in one action - skips 'completed' status
export const useManagerCompleteAndVerify = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      executionId, 
      notes,
      items
    }: { 
      executionId: string; 
      notes?: string;
      items: any[];
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Calculate verification score based on completed items
      const completedItems = items.filter(item => item.is_completed);
      const verificationScore = Math.round((completedItems.length / items.length) * 100);

      const { data, error } = await supabase
        .from('checklist_executions')
        .update({
          status: 'verified',
          completed_at: new Date().toISOString(),
          verified_at: new Date().toISOString(),
          verified_by: user.id,
          verification_score: verificationScore,
          total_score: verificationScore,
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
      queryClient.invalidateQueries({ queryKey: ['pending-verifications'] });
      toast({
        title: "Completed & Verified",
        description: "Checklist has been completed and verified successfully",
      });
    },
  });
};

// Hook to get completed checklists pending verification (for managers)
export const usePendingChecklistVerifications = () => {
  return useQuery({
    queryKey: ['pending-verifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_executions')
        .select(`
          *,
          checklist:checklists(*),
          assigned_user:users!checklist_executions_user_fk(id, name, email),
          verifier:users!checklist_executions_verified_by_fk(id, name, email)
        `)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data as ChecklistExecution[];
    },
  });
};

// Hook to get team checklist executions for dashboard (for managers)
export const useTeamChecklistExecutions = (date?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['team-checklist-executions', date],
    queryFn: async () => {
      if (!user) return [];

      const targetDate = date || new Date().toISOString().split('T')[0];

      // Fetch all executions in the organization for the target date
      const { data, error } = await supabase
        .from('checklist_executions')
        .select(`
          *,
          checklist:checklists(*),
          assigned_user:users!checklist_executions_user_fk(id, name, email),
          verifier:users!checklist_executions_verified_by_fk(id, name, email)
        `)
        .eq('execution_date', targetDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ChecklistExecution[];
    },
    enabled: !!user,
  });
};

// Hook to get checklist executions for a specific team (for admins)
export const useTeamChecklistExecutionsForDate = (teamId?: string, date?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['team-specific-checklist-executions', teamId, date],
    queryFn: async () => {
      if (!user || !teamId) return [];

      const targetDate = date || new Date().toISOString().split('T')[0];

      // Generate daily executions for the target date
      const { error: genError } = await supabase.rpc('generate_daily_checklist_executions', {
        target_date: targetDate
      });
      
      if (genError) {
        console.warn('Failed to generate daily executions:', genError);
      }

      // First get team members
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_memberships')
        .select('user_id')
        .eq('team_id', teamId);

      if (teamError) throw teamError;

      const userIds = teamMembers?.map(member => member.user_id) || [];
      
      if (userIds.length === 0) return [];

      // Fetch executions for team members
      const { data, error } = await supabase
        .from('checklist_executions')
        .select(`
          *,
          checklist:checklists(*),
          assigned_user:users!checklist_executions_user_fk(id, name, email),
          verifier:users!checklist_executions_verified_by_fk(id, name, email)
        `)
        .in('assigned_to_user_id', userIds)
        .eq('execution_date', targetDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ChecklistExecution[];
    },
    enabled: !!user && !!teamId,
  });
};