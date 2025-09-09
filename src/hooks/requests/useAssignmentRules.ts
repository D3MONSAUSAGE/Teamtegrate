import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { UserRole } from '@/types';

interface AssignmentRule {
  id: string;
  organization_id: string;
  request_type_id: string;
  rule_name: string;
  rule_type: string;
  conditions: any;
  assignment_strategy: string;
  escalation_rules: any;
  is_active: boolean;
  priority_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useAssignmentRules = (requestTypeId?: string) => {
  const { user } = useAuth();
  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = async () => {
    if (!user?.organizationId) return;

    try {
      setLoading(true);
      let query = supabase
        .from('request_assignment_rules')
        .select('*')
        .eq('organization_id', user.organizationId);

      if (requestTypeId) {
        query = query.eq('request_type_id', requestTypeId);
      }

      const { data, error: fetchError } = await query.order('priority_order', { ascending: true });

      if (fetchError) throw fetchError;
      setRules(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching assignment rules:', err);
      setError('Failed to fetch assignment rules');
      toast.error('Failed to fetch assignment rules');
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (rule: Omit<AssignmentRule, 'id' | 'organization_id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!user?.organizationId) return false;

    try {
      const { data, error: createError } = await supabase
        .from('request_assignment_rules')
        .insert({
          ...rule,
          organization_id: user.organizationId,
          created_by: user.id
        })
        .select()
        .single();

      if (createError) throw createError;

      setRules(prev => [...prev, data]);
      toast.success('Assignment rule created successfully');
      return true;
    } catch (err) {
      console.error('Error creating assignment rule:', err);
      toast.error('Failed to create assignment rule');
      return false;
    }
  };

  const updateRule = async (ruleId: string, updates: Partial<AssignmentRule>) => {
    if (!user?.organizationId) return false;

    try {
      const { data, error: updateError } = await supabase
        .from('request_assignment_rules')
        .update(updates)
        .eq('id', ruleId)
        .eq('organization_id', user.organizationId)
        .select()
        .single();

      if (updateError) throw updateError;

      setRules(prev => prev.map(rule => rule.id === ruleId ? data : rule));
      toast.success('Assignment rule updated successfully');
      return true;
    } catch (err) {
      console.error('Error updating assignment rule:', err);
      toast.error('Failed to update assignment rule');
      return false;
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!user?.organizationId) return false;

    try {
      const { error: deleteError } = await supabase
        .from('request_assignment_rules')
        .delete()
        .eq('id', ruleId)
        .eq('organization_id', user.organizationId);

      if (deleteError) throw deleteError;

      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      toast.success('Assignment rule deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting assignment rule:', err);
      toast.error('Failed to delete assignment rule');
      return false;
    }
  };

  const reorderRules = async (reorderedRules: AssignmentRule[]) => {
    if (!user?.organizationId) return false;

    try {
      const updates = reorderedRules.map((rule, index) => ({
        id: rule.id,
        priority_order: index
      }));

      for (const update of updates) {
        await supabase
          .from('request_assignment_rules')
          .update({ priority_order: update.priority_order })
          .eq('id', update.id)
          .eq('organization_id', user.organizationId);
      }

      await fetchRules(); // Refresh to get updated order
      toast.success('Rule order updated successfully');
      return true;
    } catch (err) {
      console.error('Error reordering rules:', err);
      toast.error('Failed to update rule order');
      return false;
    }
  };

  useEffect(() => {
    fetchRules();
  }, [user?.organizationId, requestTypeId]);

  return {
    rules,
    loading,
    error,
    createRule,
    updateRule,
    deleteRule,
    reorderRules,
    refetch: fetchRules
  };
};