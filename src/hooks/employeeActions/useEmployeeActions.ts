import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import type { 
  EmployeeAction, 
  CreateEmployeeActionData, 
  UpdateEmployeeActionData,
  ActionStats 
} from '@/types/employeeActions';

export const useEmployeeActions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch employee actions
  const { data: actions = [], isLoading, error } = useQuery({
    queryKey: ['employee-actions', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];
      
      const { data, error } = await supabase
        .from('employee_actions')
        .select('*')
        .eq('organization_id', user.organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch user details separately to avoid foreign key issues
      const userIds = [...new Set([...data.map(a => a.recipient_id), ...data.map(a => a.issued_by)])];
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);
      
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name')
        .eq('organization_id', user.organizationId);
      
      const usersMap = (usersData || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>);
      
      const teamsMap = (teamsData || []).reduce((acc, team) => {
        acc[team.id] = team;
        return acc;
      }, {} as Record<string, any>);
      
      return (data || []).map(action => ({
        ...action,
        recipient_name: usersMap[action.recipient_id]?.name,
        recipient_email: usersMap[action.recipient_id]?.email,
        issuer_name: usersMap[action.issued_by]?.name,
        issuer_email: usersMap[action.issued_by]?.email,
        team_name: action.team_id ? teamsMap[action.team_id]?.name : undefined,
      })) as EmployeeAction[];
    },
    enabled: !!user?.organizationId,
  });

  // Fetch actions for current user (if they are a recipient)
  const { data: myActions = [] } = useQuery({
    queryKey: ['my-employee-actions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('employee_actions')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch user details separately
      const issuerIds = [...new Set(data.map(a => a.issued_by))];
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', issuerIds);
      
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name')
        .eq('organization_id', user.organizationId);
      
      const usersMap = (usersData || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>);
      
      const teamsMap = (teamsData || []).reduce((acc, team) => {
        acc[team.id] = team;
        return acc;
      }, {} as Record<string, any>);
      
      return (data || []).map(action => ({
        ...action,
        issuer_name: usersMap[action.issued_by]?.name,
        issuer_email: usersMap[action.issued_by]?.email,
        team_name: action.team_id ? teamsMap[action.team_id]?.name : undefined,
      })) as EmployeeAction[];
    },
    enabled: !!user?.id,
  });

  // Create action mutation
  const createActionMutation = useMutation({
    mutationFn: async (data: CreateEmployeeActionData) => {
      if (!user?.organizationId) throw new Error('No organization ID');
      
      const { data: result, error } = await supabase
        .from('employee_actions')
        .insert([{
          ...data,
          organization_id: user.organizationId,
          issued_by: user.id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-actions'] });
      toast.success('Employee action created successfully');
    },
    onError: (error) => {
      console.error('Error creating employee action:', error);
      toast.error('Failed to create employee action');
    },
  });

  // Update action mutation
  const updateActionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEmployeeActionData }) => {
      const { data: result, error } = await supabase
        .from('employee_actions')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-actions'] });
      queryClient.invalidateQueries({ queryKey: ['my-employee-actions'] });
      toast.success('Employee action updated successfully');
    },
    onError: (error) => {
      console.error('Error updating employee action:', error);
      toast.error('Failed to update employee action');
    },
  });

  // Complete action mutation
  const completeActionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase
        .from('employee_actions')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-actions'] });
      queryClient.invalidateQueries({ queryKey: ['my-employee-actions'] });
      toast.success('Action marked as completed');
    },
    onError: (error) => {
      console.error('Error completing action:', error);
      toast.error('Failed to complete action');
    },
  });

  // Submit appeal mutation
  const submitAppealMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data: result, error } = await supabase
        .from('employee_actions')
        .update({ 
          status: 'appealed',
          appeal_submitted_at: new Date().toISOString(),
          appeal_reason: reason
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-actions'] });
      queryClient.invalidateQueries({ queryKey: ['my-employee-actions'] });
      toast.success('Appeal submitted successfully');
    },
    onError: (error) => {
      console.error('Error submitting appeal:', error);
      toast.error('Failed to submit appeal');
    },
  });

  // Calculate stats
  const stats: ActionStats = {
    total_actions: actions.length,
    active_actions: actions.filter(a => a.status === 'active').length,
    completed_actions: actions.filter(a => a.status === 'completed').length,
    escalated_actions: actions.filter(a => a.status === 'escalated').length,
    by_type: actions.reduce((acc, action) => {
      acc[action.action_type] = (acc[action.action_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    by_category: actions.reduce((acc, action) => {
      acc[action.category] = (acc[action.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    by_severity: actions.reduce((acc, action) => {
      acc[action.severity] = (acc[action.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    pending_follow_ups: actions.filter(a => 
      a.follow_up_date && new Date(a.follow_up_date) <= new Date() && a.status === 'active'
    ).length,
    overdue_actions: actions.filter(a => 
      a.due_date && new Date(a.due_date) < new Date() && a.status === 'active'
    ).length,
  };

  return {
    actions,
    myActions,
    stats,
    isLoading,
    error,
    createAction: createActionMutation.mutate,
    updateAction: updateActionMutation.mutate,
    completeAction: completeActionMutation.mutate,
    submitAppeal: submitAppealMutation.mutate,
    isCreating: createActionMutation.isPending,
    isUpdating: updateActionMutation.isPending,
    isCompleting: completeActionMutation.isPending,
    isSubmittingAppeal: submitAppealMutation.isPending,
  };
};