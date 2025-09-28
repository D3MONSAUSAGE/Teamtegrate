import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UseWarehouseRealtimeOptions {
  warehouseId?: string;
}

export const useWarehouseRealtime = (options?: UseWarehouseRealtimeOptions) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { warehouseId } = options || {};

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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'warehouse_receipts',
        },
        (payload) => {
          console.log('🧾 Warehouse receipts real-time update received:', payload);
          
          // Invalidate receipt-related queries
          queryClient.invalidateQueries({ 
            queryKey: ['warehouse-receipts'] 
          });
          
          // If a receipt was posted, also invalidate items
          if (payload.new && 'status' in payload.new && payload.new.status === 'posted') {
            console.log('📦 Receipt posted, invalidating warehouse items');
            if (warehouseId) {
              queryClient.invalidateQueries({ 
                queryKey: ['warehouse-items', warehouseId] 
              });
            }
            queryClient.invalidateQueries({ 
              queryKey: ['warehouse-items'] 
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'warehouse_receipt_lines',
        },
        (payload) => {
          console.log('📋 Warehouse receipt lines real-time update received:', payload);
          
          // Invalidate receipt lines queries
          queryClient.invalidateQueries({ 
            queryKey: ['warehouse-receipt-lines'] 
          });
        }
      )
      .subscribe();

    return () => {
      console.log('🏭 useWarehouseRealtime: Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.organizationId, warehouseId]);
};