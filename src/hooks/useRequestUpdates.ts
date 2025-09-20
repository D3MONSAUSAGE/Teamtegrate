import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RequestUpdate } from '@/types/requests';
import { toast } from '@/components/ui/sonner';

export const useRequestUpdates = (requestId: string | undefined) => {
  const [updates, setUpdates] = useState<RequestUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchUpdates = useCallback(async () => {
    if (!requestId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('request_updates')
        .select(`
          *,
          user:users(id, name)
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUpdates(
        (data || []).map((row: any) => ({
          ...row,
          user: row.user?.id ? row.user : undefined,
        }))
      );
      setError(null);
    } catch (err) {
      console.error('Error fetching request updates:', err);
      setError('Failed to load updates');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  const addUpdate = useCallback(async (
    updateType: 'progress' | 'status_change' | 'assignment' | 'comment',
    title: string,
    content?: string,
    oldStatus?: string,
    newStatus?: string,
    metadata?: Record<string, any>
  ) => {
    if (!requestId || !user?.organizationId) {
      toast.error('Missing request or organization information');
      return;
    }

    try {
      const { error } = await supabase
        .from('request_updates')
        .insert({
          organization_id: user.organizationId,
          request_id: requestId,
          user_id: user.id,
          update_type: updateType,
          title,
          content,
          old_status: oldStatus,
          new_status: newStatus,
          metadata: metadata || {}
        });

      if (error) throw error;

      // Refresh the updates list
      await fetchUpdates();
      toast.success('Update added successfully');
    } catch (error) {
      console.error('Error adding update:', error);
      toast.error('Failed to add update');
    }
  }, [requestId, user, fetchUpdates]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`request-updates-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'request_updates',
          filter: `request_id=eq.${requestId}`,
        },
        () => {
          fetchUpdates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, fetchUpdates]);

  return { updates, loading, error, addUpdate, refetch: fetchUpdates };
};