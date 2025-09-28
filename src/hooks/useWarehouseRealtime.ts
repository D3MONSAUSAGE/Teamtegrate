import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useWarehouseRealtime = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.organizationId) return;

    console.log('🏭 useWarehouseRealtime: Setting up real-time subscription for warehouse items');

    const channel = supabase
      .channel('warehouse-items-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'warehouse_items',
          filter: `warehouse_id=in.(${user.organizationId})` // Filter by organization through warehouse
        },
        (payload) => {
          console.log('🔄 Warehouse items real-time update received:', payload);
          
          // Invalidate all warehouse-related queries to trigger refetch
          queryClient.invalidateQueries({ 
            queryKey: ['warehouse'] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['warehouse-items'] 
          });
        }
      )
      .subscribe();

    return () => {
      console.log('🏭 useWarehouseRealtime: Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.organizationId]);
};