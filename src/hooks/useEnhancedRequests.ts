import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { notifications } from '@/lib/notifications';
import { toast } from '@/components/ui/sonner';
import { useRequestsRealtime } from './useRequestsRealtime';
import type { Request, RequestType } from '@/types/requests';

/**
 * Enhanced requests hook with auto-assignment and team hierarchy support
 */
export function useEnhancedRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(() => {
    fetchRequests();
    fetchRequestTypes();
  }, []);

  // Set up real-time subscriptions
  useRequestsRealtime({ onRequestChange: refreshData });

  const fetchRequestTypes = async () => {
    if (!user?.organizationId) {
      console.warn('No organization ID available for fetching request types');
      return;
    }
    
    try {
      console.log('Fetching request types for organization:', user.organizationId);
      
      // Fetch both organization-specific and global request types
      const { data, error } = await supabase
        .from('request_types')
        .select('*')
        .eq('is_active', true)
        .in('organization_id', [user.organizationId, '00000000-0000-0000-0000-000000000000'])
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error fetching request types:', error);
        throw error;
      }
      
      console.log('Fetched request types:', data?.length || 0);
      setRequestTypes((data || []).map(item => ({
        ...item,
        form_schema: Array.isArray(item.form_schema) ? item.form_schema as any[] : [],
        approval_roles: item.approval_roles || [],
        description: item.description || undefined,
        is_active: item.is_active ?? true,
        requires_approval: item.requires_approval ?? true,
        required_permissions: item.required_permissions as Array<{ module_id: string; action_id: string }> | null || null,
        creator_role_restrictions: item.creator_role_restrictions || null,
        viewer_role_restrictions: item.viewer_role_restrictions || null,
        permission_metadata: item.permission_metadata as Record<string, any> || null,
        default_job_roles: item.default_job_roles || [],
        selected_user_ids: item.selected_user_ids || [],
        expertise_tags: item.expertise_tags || []
      })) as RequestType[]);
    } catch (err) {
      console.error('Error fetching request types:', err);
      setError('Failed to load request types');
    }
  };

  const fetchRequests = async () => {
    if (!user?.organizationId) {
      console.warn('No organization ID available for fetching requests');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching requests for organization:', user.organizationId);
      
      // Simplified query - let RLS handle access control
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          request_type:request_types(id, name, category, description)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching requests:', error);
        throw error;
      }
      
      console.log('Fetched requests:', data?.length || 0);
      
      setRequests((data || []).map(item => ({
        ...item,
        form_data: typeof item.form_data === 'object' && item.form_data !== null ? item.form_data as Record<string, any> : {},
        priority: item.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: item.status as 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled',
        description: item.description || undefined,
        due_date: item.due_date || undefined,
        submitted_at: item.submitted_at || undefined,
        completed_at: item.completed_at || undefined,
        // Keep the actual request_type data instead of overriding it
        request_type: item.request_type ? {
          ...item.request_type,
          form_schema: [],
          requires_approval: true,
          approval_roles: [],
          is_active: true,
          created_by: '',
          created_at: '',
          updated_at: ''
        } : undefined
      })) as unknown as Request[]);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const createRequestWithAutoAssignment = async (requestData: {
    request_type_id: string;
    title: string;
    description?: string;
    form_data: Record<string, any>;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    due_date?: string;
  }) => {
    try {
      if (!user?.id || !user?.organizationId) throw new Error('User not authenticated');

      // Create the request
      const { data: requestRecord, error } = await supabase
        .from('requests')
        .insert({
          ...requestData,
          requested_by: user.id,
          organization_id: user.organizationId,
          priority: requestData.priority || 'medium',
          status: 'draft'
        })
        .select(`
          *,
          request_type:request_types(name, category, approval_roles)
        `)
        .single();

      if (error) throw error;

      // Auto-assign approvers based on request type and user's team hierarchy
      await autoAssignApprovers(requestRecord.id, requestRecord.request_type?.name || '');

      // Send centralized notifications for request creation
      try {
        await notifications.notifyTicketCreated(
          {
            id: requestRecord.id,
            title: requestRecord.title,
            description: requestRecord.description,
            status: requestRecord.status,
            priority: requestRecord.priority,
            created_at: requestRecord.created_at,
            organization_id: requestRecord.organization_id,
            ticket_number: requestRecord.ticket_number
          },
          {
            id: user.id,
            email: user.email || '',
            name: user.name
          }
        );
        console.log('Centralized notifications sent for request creation');
      } catch (notificationError) {
        console.warn('Failed to send notifications:', notificationError);
        // Don't fail the request creation if notifications fail
      }

      await fetchRequests();
      toast.success('Request created successfully');
      return requestRecord;
    } catch (err) {
      console.error('Error creating request:', err);
      toast.error('Failed to create request');
      throw err;
    }
  };

  const autoAssignApprovers = async (requestId: string, requestTypeName: string) => {
    try {
      if (!user?.id) return;

      const approvers = [];

      // For time entry corrections, prioritize team manager
      if (requestTypeName === 'Time Entry Correction') {
        const { data: managerId } = await supabase.rpc('get_user_team_manager', { 
          target_user_id: user.id 
        });
        
        if (managerId) {
          approvers.push({
            request_id: requestId,
            approver_id: managerId,
            approval_level: 1,
            status: 'pending',
            organization_id: user.organizationId
          });
        }
      }

      // Add admin/superadmin as secondary approvers
      const { data: adminUsers } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', user.organizationId)
        .in('role', ['admin', 'superadmin']);

      if (adminUsers) {
        adminUsers.forEach((admin, index) => {
          approvers.push({
            request_id: requestId,
            approver_id: admin.id,
            approval_level: approvers.length > 0 ? 2 : 1, // Secondary if manager exists
            status: 'pending',
            organization_id: user.organizationId
          });
        });
      }

      if (approvers.length > 0) {
        const { error } = await supabase
          .from('request_approvals')
          .insert(approvers);

        if (error) {
          console.error('Error creating approvals:', error);
        }
      }
    } catch (error) {
      console.error('Error auto-assigning approvers:', error);
    }
  };

  const submitRequest = async (requestId: string) => {
    try {
      const { data: requestRecord, error } = await supabase
        .from('requests')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select(`
          *,
          request_type:request_types(name)
        `)
        .single();

      if (error) throw error;

      // Send centralized notifications for request submission (status change from draft to submitted)
      try {
        await notifications.notifyTicketUpdated(
          {
            id: requestRecord.id,
            title: requestRecord.title,
            description: requestRecord.description,
            status: requestRecord.status,
            priority: requestRecord.priority || 'medium',
            created_at: requestRecord.created_at,
            organization_id: requestRecord.organization_id,
            ticket_number: requestRecord.ticket_number
          },
          'draft',
          'submitted',
          {
            id: user.id,
            email: user.email || '',
            name: user.name
          }
        );
        console.log('Centralized notifications sent for request submission');
      } catch (notificationError) {
        console.warn('Failed to send notifications:', notificationError);
      }

      await fetchRequests();
      toast.success('Request submitted successfully');
    } catch (err) {
      console.error('Error submitting request:', err);
      toast.error('Failed to submit request');
      throw err;
    }
  };

  const updateRequestStatus = async (
    requestId: string, 
    newStatus: 'approved' | 'rejected' | 'in_progress' | 'completed',
    comments?: string
  ) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      // Get the current request first to capture old status
      const { data: currentRequest, error: fetchError } = await supabase
        .from('requests')
        .select('status')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;
      const oldStatus = currentRequest?.status;

      const { data: requestRecord, error: updateError } = await supabase
        .from('requests')
        .update({
          status: newStatus,
          ...(newStatus === 'completed' && { completed_at: new Date().toISOString() })
        })
        .eq('id', requestId)
        .select('*')
        .single();

      if (updateError) throw updateError;

      // Update the approval record only for approval/rejection actions
      if (['approved', 'rejected'].includes(newStatus)) {
        const { error: approvalError } = await supabase
          .from('request_approvals')
          .update({
            status: newStatus,
            approved_at: new Date().toISOString(),
            comments
          })
          .eq('request_id', requestId)
          .eq('approver_id', user.id);

        if (approvalError) {
          console.warn('Failed to update approval record:', approvalError);
        }
      }

      // Send centralized notifications for status change
      try {
        await notifications.notifyTicketUpdated(
          {
            id: requestRecord.id,
            title: requestRecord.title,
            description: requestRecord.description,
            status: requestRecord.status,
            priority: requestRecord.priority || 'medium',
            created_at: requestRecord.created_at,
            organization_id: requestRecord.organization_id,
            ticket_number: requestRecord.ticket_number
          },
          oldStatus,
          newStatus,
          {
            id: user.id,
            email: user.email || '',
            name: user.name
          },
          comments
        );
        
        // Special handling for ticket closed
        if (newStatus === 'completed') {
          await notifications.notifyTicketClosed(
            {
              id: requestRecord.id,
              title: requestRecord.title,
              description: requestRecord.description,
              status: requestRecord.status,
              priority: requestRecord.priority || 'medium',
              created_at: requestRecord.created_at,
              organization_id: requestRecord.organization_id,
              ticket_number: requestRecord.ticket_number
            },
            comments || 'Ticket has been resolved.',
            {
              id: user.id,
              email: user.email || '',
              name: user.name
            }
          );
        }
        
        console.log('Centralized notifications sent for status change');
      } catch (notificationError) {
        console.warn('Failed to send notifications:', notificationError);
      }

      await fetchRequests();
      toast.success(`Request ${newStatus} successfully`);
    } catch (err) {
      console.error('Error updating request status:', err);
      toast.error(`Failed to ${newStatus} request`);
      throw err;
    }
  };

  useEffect(() => {
    if (user?.organizationId) {
      fetchRequestTypes();
      fetchRequests();
    }
  }, [user?.organizationId]);

  return {
    requests,
    requestTypes,
    loading,
    error,
    fetchRequests,
    fetchRequestTypes,
    createRequestWithAutoAssignment,
    submitRequest,
    updateRequestStatus,
    autoAssignApprovers
  };
}