import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TodayMessagesState {
  count: number;
  loading: boolean;
  error: string | null;
}

export function useTodayMessages() {
  const { user } = useAuth();
  const [state, setState] = useState<TodayMessagesState>({ count: 0, loading: true, error: null });

  const getStartOfLocalDayISO = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  };

  const fetchCount = useCallback(async () => {
    if (!user?.organizationId) {
      setState({ count: 0, loading: false, error: null });
      return;
    }
    try {
      setState(prev => ({ ...prev, loading: true }));
      const startOfDay = getStartOfLocalDayISO();
      const client: any = supabase;
      const { count, error } = await client
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId)
        .gte('created_at', startOfDay)
        .is('deleted_at', null);

      if (error) throw error;
      setState({ count: count ?? 0, loading: false, error: null });
    } catch (err: any) {
      setState({ count: 0, loading: false, error: err.message || 'Failed to load' });
    }
  }, [user?.organizationId]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Realtime updates: refetch when messages change in org
  useEffect(() => {
    if (!user?.organizationId) return;

    const channel = supabase
      .channel(`chat_messages_today_${user.organizationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `organization_id=eq.${user.organizationId}`
      }, () => {
        fetchCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.organizationId, fetchCount]);

  return { ...state, refresh: fetchCount };
}
