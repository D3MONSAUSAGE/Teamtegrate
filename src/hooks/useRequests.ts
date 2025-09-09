import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Request, RequestType, RequestAttachment, RequestApproval, RequestComment } from '@/types/requests';
import { enhancedNotifications } from '@/utils/enhancedNotifications';
import type { Json } from '@/integrations/supabase/types';

export function useRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequestTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('request_types')
        .select('*')
        .eq('is_active', true)
        .order('category, name');

      if (error) throw error;
      setRequestTypes((data || []).map(item => ({
        ...item,
        form_schema: Array.isArray(item.form_schema) ? item.form_schema as any[] : [],
        approval_roles: item.approval_roles || [],
        description: item.description || undefined,
        is_active: item.is_active ?? true,
        requires_approval: item.requires_approval ?? true
      })) as RequestType[]);
    } catch (err) {
      console.error('Error fetching request types:', err);
      setError('Failed to load request types');
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          request_type:request_types(name, category, description),
          requested_by_user:users!requests_requested_by_fkey(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data || []).map(item => ({
        ...item,
        form_data: typeof item.form_data === 'object' && item.form_data !== null ? item.form_data as Record<string, any> : {},
        priority: item.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: item.status as 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed' | 'cancelled',
        description: item.description || undefined,
        due_date: item.due_date || undefined,
        submitted_at: item.submitted_at || undefined,
        completed_at: item.completed_at || undefined,
        request_type: item.request_type ? {
          ...item.request_type,
          id: '',
          organization_id: '',
          form_schema: [],
          requires_approval: true,
          approval_roles: [],
          is_active: true,
          created_by: '',
          created_at: '',
          updated_at: ''
        } : undefined,
        requested_by_user: (item.requested_by_user as any)?.id ? item.requested_by_user as any : undefined
      })) as unknown as Request[]);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (requestData: {
    request_type_id: string;
    title: string;
    description?: string;
    form_data: Record<string, any>;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    due_date?: string;
  }) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('requests')
        .insert({
          ...requestData,
          requested_by: user.user.id,
          organization_id: (await supabase
            .from('users')
            .select('organization_id')
            .eq('id', user.user.id)
            .single()
          ).data?.organization_id,
          priority: requestData.priority || 'medium',
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      await fetchRequests();
      enhancedNotifications.success('Request created successfully');
      return data;
    } catch (err) {
      console.error('Error creating request:', err);
      enhancedNotifications.error('Failed to create request');
      throw err;
    }
  };

  const updateRequest = async (id: string, updates: Partial<Request>) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchRequests();
      enhancedNotifications.success('Request updated successfully');
    } catch (err) {
      console.error('Error updating request:', err);
      enhancedNotifications.error('Failed to update request');
      throw err;
    }
  };

  const submitRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await fetchRequests();
      enhancedNotifications.success('Request submitted successfully');
    } catch (err) {
      console.error('Error submitting request:', err);
      enhancedNotifications.error('Failed to submit request');
      throw err;
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchRequests();
      enhancedNotifications.success('Request deleted successfully');
    } catch (err) {
      console.error('Error deleting request:', err);
      enhancedNotifications.error('Failed to delete request');
      throw err;
    }
  };

  useEffect(() => {
    fetchRequestTypes();
    fetchRequests();
  }, []);

  return {
    requests,
    requestTypes,
    loading,
    error,
    fetchRequests,
    fetchRequestTypes,
    createRequest,
    updateRequest,
    submitRequest,
    deleteRequest,
  };
}

export function useRequestDetails(requestId: string) {
  const [request, setRequest] = useState<Request | null>(null);
  const [attachments, setAttachments] = useState<RequestAttachment[]>([]);
  const [approvals, setApprovals] = useState<RequestApproval[]>([]);
  const [comments, setComments] = useState<RequestComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);

      // Fetch request details
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select(`
          *,
          request_type:request_types(*),
          requested_by_user:users!requests_requested_by_fkey(id, name, email)
        `)
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;
      setRequest(requestData ? {
        ...requestData,
        form_data: typeof requestData.form_data === 'object' && requestData.form_data !== null ? requestData.form_data as Record<string, any> : {},
        priority: requestData.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: requestData.status as 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed' | 'cancelled',
        description: requestData.description || undefined,
        due_date: requestData.due_date || undefined,
        submitted_at: requestData.submitted_at || undefined,
        completed_at: requestData.completed_at || undefined,
        request_type: requestData.request_type ? {
          ...requestData.request_type,
          form_schema: Array.isArray(requestData.request_type.form_schema) ? requestData.request_type.form_schema as any[] : [],
          approval_roles: requestData.request_type.approval_roles || [],
          is_active: requestData.request_type.is_active ?? true,
          requires_approval: requestData.request_type.requires_approval ?? true
        } : undefined,
        requested_by_user: (requestData.requested_by_user as any)?.id ? requestData.requested_by_user as any : undefined
      } as unknown as Request : null);

      // Fetch attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('request_attachments')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at');

      if (attachmentsError) throw attachmentsError;
      setAttachments(attachmentsData || []);

      // Fetch approvals
      const { data: approvalsData, error: approvalsError } = await supabase
        .from('request_approvals')
        .select(`
          *,
          approver:users(id, name, role)
        `)
        .eq('request_id', requestId)
        .order('approval_level');

      if (approvalsError) throw approvalsError;
      setApprovals((approvalsData || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'approved' | 'rejected',
        approver: (item.approver as any)?.id ? item.approver as any : undefined,
        comments: item.comments || undefined,
        approved_at: item.approved_at || undefined
      })) as RequestApproval[]);

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('request_comments')
        .select(`
          *,
          user:users(id, name)
        `)
        .eq('request_id', requestId)
        .order('created_at');

      if (commentsError) throw commentsError;
      setComments((commentsData || []).map(item => ({
        ...item,
        user: (item.user as any)?.id ? item.user as any : undefined
      })) as RequestComment[]);

    } catch (err) {
      console.error('Error fetching request details:', err);
      setError('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (content: string, isInternal = false) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: orgRow, error: orgErr } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.user.id)
        .single();
      if (orgErr) throw orgErr;
      const orgId = orgRow?.organization_id as string | undefined;

      const { error: commentErr } = await supabase
        .from('request_comments')
        .insert({
          request_id: requestId,
          user_id: user.user.id,
          content,
          is_internal: isInternal,
          organization_id: orgId
        });

      if (commentErr) throw commentErr;

      // Log activity
      if (orgId) {
        await supabase.from('request_activity_feed').insert({
          organization_id: orgId,
          request_id: requestId,
          user_id: user.user.id,
          activity_type: 'comment_added',
          activity_data: { preview: content.slice(0, 200) }
        });
      }

      // Force immediate refresh of comments
      setTimeout(async () => {
        await fetchRequestDetails();
      }, 100);

      enhancedNotifications.success('Comment added successfully');
    } catch (err) {
      console.error('Error adding comment:', err);
      enhancedNotifications.error('Failed to add comment');
      throw err;
    }
  };
  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId]);

  // Realtime updates for request comments
  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`request-comments-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'request_comments',
          filter: `request_id=eq.${requestId}`,
        },
        () => {
          // Refresh comments on any change
          fetchRequestDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  return {
    request,
    attachments,
    approvals,
    comments,
    loading,
    error,
    fetchRequestDetails,
    addComment,
  };
}