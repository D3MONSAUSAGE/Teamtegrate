import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { UserRole } from '@/types';

interface ApprovalWorkflow {
  id: string;
  organization_id: string;
  request_type_id: string;
  workflow_name: string;
  approval_levels: any;
  workflow_type: string;
  timeout_hours: number;
  auto_escalate: boolean;
  delegation_allowed: boolean;
  emergency_override_roles: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useApprovalWorkflows = (requestTypeId?: string) => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = async () => {
    if (!user?.organizationId) return;

    try {
      setLoading(true);
      let query = supabase
        .from('request_approval_workflows')
        .select('*')
        .eq('organization_id', user.organizationId);

      if (requestTypeId) {
        query = query.eq('request_type_id', requestTypeId);
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setWorkflows(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching approval workflows:', err);
      setError('Failed to fetch approval workflows');
      toast.error('Failed to fetch approval workflows');
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async (workflow: Omit<ApprovalWorkflow, 'id' | 'organization_id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!user?.organizationId) return false;

    try {
      const { data, error: createError } = await supabase
        .from('request_approval_workflows')
        .insert({
          ...workflow,
          organization_id: user.organizationId,
          created_by: user.id
        })
        .select()
        .single();

      if (createError) throw createError;

      setWorkflows(prev => [data, ...prev]);
      toast.success('Approval workflow created successfully');
      return true;
    } catch (err) {
      console.error('Error creating approval workflow:', err);
      toast.error('Failed to create approval workflow');
      return false;
    }
  };

  const updateWorkflow = async (workflowId: string, updates: Partial<ApprovalWorkflow>) => {
    if (!user?.organizationId) return false;

    try {
      const { data, error: updateError } = await supabase
        .from('request_approval_workflows')
        .update(updates)
        .eq('id', workflowId)
        .eq('organization_id', user.organizationId)
        .select()
        .single();

      if (updateError) throw updateError;

      setWorkflows(prev => prev.map(workflow => workflow.id === workflowId ? data : workflow));
      toast.success('Approval workflow updated successfully');
      return true;
    } catch (err) {
      console.error('Error updating approval workflow:', err);
      toast.error('Failed to update approval workflow');
      return false;
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    if (!user?.organizationId) return false;

    try {
      const { error: deleteError } = await supabase
        .from('request_approval_workflows')
        .delete()
        .eq('id', workflowId)
        .eq('organization_id', user.organizationId);

      if (deleteError) throw deleteError;

      setWorkflows(prev => prev.filter(workflow => workflow.id !== workflowId));
      toast.success('Approval workflow deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting approval workflow:', err);
      toast.error('Failed to delete approval workflow');
      return false;
    }
  };

  const duplicateWorkflow = async (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return false;

    const { id, created_at, updated_at, ...workflowData } = workflow;
    return await createWorkflow({
      ...workflowData,
      workflow_name: `${workflow.workflow_name} (Copy)`
    });
  };

  useEffect(() => {
    fetchWorkflows();
  }, [user?.organizationId, requestTypeId]);

  return {
    workflows,
    loading,
    error,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    duplicateWorkflow,
    refetch: fetchWorkflows
  };
};