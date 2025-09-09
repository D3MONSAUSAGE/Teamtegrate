import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UseRequestsRealtimeProps {
  onRequestChange: () => void;
}

export function useRequestsRealtime({ onRequestChange }: UseRequestsRealtimeProps) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.organizationId) return;

    console.log('Setting up real-time subscriptions for requests');

    // Subscribe to requests changes
    const requestsChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
          filter: `organization_id=eq.${user.organizationId}`
        },
        (payload) => {
          console.log('Real-time request change:', payload);
          onRequestChange();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'request_approvals',
          filter: `organization_id=eq.${user.organizationId}`
        },
        (payload) => {
          console.log('Real-time approval change:', payload);
          onRequestChange();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(requestsChannel);
    };
  }, [user?.organizationId, onRequestChange]);
}