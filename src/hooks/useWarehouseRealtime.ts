import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UseWarehouseRealtimeOptions {
  warehouseId?: string;
  callback?: () => Promise<void>;
}

export const useWarehouseRealtime = (options?: UseWarehouseRealtimeOptions) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { warehouseId, callback } = options || {};

  useEffect(() => {
    if (!user?.organizationId) return;

    console.log('🏭 useWarehouseRealtime: Setting up real-time subscription for warehouse tables');

    // Create unique channel name for each warehouse or organization
    const channelName = warehouseId 
      ? `warehouse-${warehouseId}-realtime`
      : `warehouse-org-${user.organizationId}-realtime`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'warehouse_items',
        },
        (payload) => {
          console.log('🔄 Warehouse items real-time update received:', payload);
          
          // Call custom callback if provided (for WarehouseContext)
          if (callback) {
            callback();
          }
          
          // Invalidate specific warehouse queries if we have a warehouseId
          if (warehouseId) {
            queryClient.invalidateQueries({ 
              queryKey: ['warehouse-items', warehouseId] 
            });
          }
          
          // Always invalidate general warehouse queries
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
  }, [queryClient, user?.organizationId, warehouseId, callback]);
};