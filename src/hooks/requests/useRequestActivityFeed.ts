import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityItem {
  id: string;
  organization_id: string;
  request_id: string;
  user_id: string;
  activity_type: string;
  activity_data: Record<string, any>;
  metadata?: Record<string, any> | null;
  created_at: string;
  user?: { id: string; name?: string | null };
}

export const useRequestActivityFeed = (requestId: string | undefined) => {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('request_activity_feed')
        .select(`*, user:users(id, name)`) 
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setItems(
        (data || []).map((row: any) => ({
          ...row,
          user: row.user?.id ? row.user : undefined,
        }))
      );
      setError(null);
    } catch (err) {
      console.error('Error fetching activity feed:', err);
      setError('Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`request-activity-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'request_activity_feed',
          filter: `request_id=eq.${requestId}`,
        },
        () => {
          fetchFeed();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, fetchFeed]);

  return { items, loading, error, refetch: fetchFeed };
};
