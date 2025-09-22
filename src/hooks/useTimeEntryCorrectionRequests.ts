import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CorrectionRequest {
  id: string;
  organization_id: string;
  employee_id: string;
  manager_id: string | null;
  admin_id: string | null;
  requested_at: string;
  manager_reviewed_at: string | null;
  admin_reviewed_at: string | null;
  status: 'pending' | 'manager_approved' | 'approved' | 'rejected';
  employee_reason: string;
  manager_notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CorrectionDetail {
  id: string;
  correction_request_id: string;
  time_entry_id: string;
  original_clock_in: string | null;
  original_clock_out: string | null;
  original_notes: string | null;
  corrected_clock_in: string | null;
  corrected_clock_out: string | null;
  corrected_notes: string | null;
  created_at: string;
}

export interface CreateCorrectionRequest {
  employee_reason: string;
  manager_id?: string;
  corrections: Array<{
    time_entry_id: string | null; // Allow null for missing day corrections
    original_clock_in: string | null;
    original_clock_out: string | null;
    original_notes: string | null;
    corrected_clock_in: string | null;
    corrected_clock_out: string | null;
    corrected_notes: string | null;
  }>;
}

export const useTimeEntryCorrectionRequests = () => {
  const [requests, setRequests] = useState<CorrectionRequest[]>([]);
  const [corrections, setCorrections] = useState<Record<string, CorrectionDetail[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string; organization_id: string } | null>(null);

  // Initialize current user
  useEffect(() => {
    const initUser = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) return;

        const { data: userData, error } = await supabase
          .from('users')
          .select('id, role, organization_id')
          .eq('id', authData.user.id)
          .single();

        if (error) throw error;
        setCurrentUser(userData);
      } catch (error: any) {
        console.error('Failed to initialize user:', error);
      }
    };

    initUser();
  }, []);

  const fetchRequests = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const { data: requestData, error } = await supabase
        .from('time_entry_correction_requests')
        .select('*')
        .eq('organization_id', currentUser.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((requestData || []) as CorrectionRequest[]);

      // Fetch correction details for each request
      if (requestData && requestData.length > 0) {
        const { data: correctionData, error: correctionError } = await supabase
          .from('time_entry_corrections')
          .select('*')
          .in('correction_request_id', requestData.map(r => r.id));

        if (correctionError) throw correctionError;

        const correctionsByRequest: Record<string, CorrectionDetail[]> = {};
        (correctionData || []).forEach((correction) => {
          if (!correctionsByRequest[correction.correction_request_id]) {
            correctionsByRequest[correction.correction_request_id] = [];
          }
          correctionsByRequest[correction.correction_request_id].push(correction);
        });
        setCorrections(correctionsByRequest);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load correction requests');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createCorrectionRequest = useCallback(async (requestData: CreateCorrectionRequest) => {
    if (!currentUser) throw new Error('User not authenticated');

    try {
      // Get user's manager (for now, we'll use the first admin/manager we find)
      const { data: managerData } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', currentUser.organization_id)
        .in('role', ['manager', 'admin', 'superadmin'])
        .limit(1)
        .single();

      const { data: request, error: requestError } = await supabase
        .from('time_entry_correction_requests')
        .insert({
          organization_id: currentUser.organization_id,
          employee_id: currentUser.id,
          manager_id: requestData.manager_id || managerData?.id || null,
          employee_reason: requestData.employee_reason,
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Insert correction details
      const correctionInserts = requestData.corrections.map(correction => ({
        ...correction,
        correction_request_id: request.id,
      }));

      const { error: correctionsError } = await supabase
        .from('time_entry_corrections')
        .insert(correctionInserts);

      if (correctionsError) throw correctionsError;

      toast.success('Correction request submitted successfully');
      await fetchRequests();
      
      return request.id;
    } catch (error: any) {
      toast.error(error.message || 'Failed to create correction request');
      throw error;
    }
  }, [currentUser, fetchRequests]);

  const applyCorrections = useCallback(async (requestId: string) => {
    const requestCorrections = corrections[requestId];
    if (!requestCorrections) return;

    try {
      for (const correction of requestCorrections) {
        const updates: any = {};
        if (correction.corrected_clock_in) updates.clock_in = correction.corrected_clock_in;
        if (correction.corrected_clock_out !== undefined) updates.clock_out = correction.corrected_clock_out;
        if (correction.corrected_notes !== undefined) updates.notes = correction.corrected_notes;

        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from('time_entries')
            .update(updates)
            .eq('id', correction.time_entry_id);

          if (error) throw error;
        }
      }
    } catch (error: any) {
      console.error('Failed to apply corrections:', error);
      throw error;
    }
  }, [corrections]);

  const updateMultipleRequestsStatus = useCallback(async (
    requestIds: string[],
    status: 'manager_approved' | 'approved' | 'rejected',
    notes?: string
  ) => {
    if (!currentUser) throw new Error('User not authenticated');

    try {
      const updates: any = {
        status,
        ...(status === 'manager_approved' ? { 
          manager_reviewed_at: new Date().toISOString(),
          manager_notes: notes 
        } : {}),
        ...(status === 'approved' || status === 'rejected' ? { 
          admin_reviewed_at: new Date().toISOString(),
          admin_notes: notes,
          admin_id: currentUser.id
        } : {}),
      };

      // Update all requests
      const { error } = await supabase
        .from('time_entry_correction_requests')
        .update(updates)
        .in('id', requestIds);

      if (error) throw error;

      // If approved, apply corrections for all requests
      if (status === 'approved') {
        for (const requestId of requestIds) {
          await applyCorrections(requestId);
        }
      }

      toast.success(`${requestIds.length} requests ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'approved by manager'}`);
      await fetchRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update request statuses');
      throw error;
    }
  }, [currentUser, fetchRequests, applyCorrections]);

  const updateRequestStatus = useCallback(async (
    requestId: string, 
    status: 'manager_approved' | 'approved' | 'rejected',
    notes?: string
  ) => {
    if (!currentUser) throw new Error('User not authenticated');

    try {
      const updates: any = {
        status,
        ...(status === 'manager_approved' ? { 
          manager_reviewed_at: new Date().toISOString(),
          manager_notes: notes 
        } : {}),
        ...(status === 'approved' || status === 'rejected' ? { 
          admin_reviewed_at: new Date().toISOString(),
          admin_notes: notes,
          admin_id: currentUser.id
        } : {}),
      };

      const { error } = await supabase
        .from('time_entry_correction_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      // If approved, apply the corrections to actual time entries
      if (status === 'approved') {
        await applyCorrections(requestId);
      }

      toast.success(`Request ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'approved by manager'}`);
      await fetchRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update request status');
      throw error;
    }
  }, [currentUser, fetchRequests, applyCorrections]);


  // Real-time subscriptions
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('correction_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entry_correction_requests',
          filter: `organization_id=eq.${currentUser.organization_id}`,
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, fetchRequests]);

  // Filter requests based on user role
  const myRequests = requests.filter(r => r.employee_id === currentUser?.id);
  const pendingManagerRequests = requests.filter(r => 
    r.status === 'pending' && 
    r.manager_id === currentUser?.id
  );
  const pendingAdminRequests = requests.filter(r => 
    (r.status === 'manager_approved' || r.status === 'pending') &&
    ['admin', 'superadmin'].includes(currentUser?.role || '')
  );

  return {
    requests,
    corrections,
    isLoading,
    currentUser,
    myRequests,
    pendingManagerRequests,
    pendingAdminRequests,
    createCorrectionRequest,
    updateRequestStatus,
    updateMultipleRequestsStatus,
    fetchRequests,
  };
};