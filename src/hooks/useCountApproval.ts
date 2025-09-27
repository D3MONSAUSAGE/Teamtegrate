import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ApprovalData {
  countId: string;
  approved: boolean;
  notes?: string;
}

export const useCountApproval = () => {
  const [isApproving, setIsApproving] = useState(false);
  const { toast } = useToast();

  const approveCount = async (data: ApprovalData) => {
    setIsApproving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Update count approval status
      const { error: updateError } = await supabase
        .from('inventory_counts')
        .update({
          approval_status: data.approved ? 'approved' : 'rejected',
          approved_by: user.user.id,
          approved_at: new Date().toISOString(),
          approval_notes: data.notes || null,
        })
        .eq('id', data.countId);

      if (updateError) throw updateError;

      if (data.approved) {
        // If approved, update warehouse stock
        await updateWarehouseFromCount(data.countId);
        
        toast({
          title: 'Count Approved',
          description: 'Inventory count approved and warehouse quantities updated.',
        });
      } else {
        toast({
          title: 'Count Rejected',
          description: 'Inventory count has been rejected.',
          variant: 'destructive',
        });
      }

      return true;
    } catch (error: any) {
      toast({
        title: 'Approval Failed',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsApproving(false);
    }
  };

  const updateWarehouseFromCount = async (countId: string) => {
    try {
      // Get count items with actual quantities
      const { data: countItems, error: countError } = await supabase
        .from('inventory_count_items')
        .select(`
          item_id,
          actual_quantity,
          in_stock_quantity
        `)
        .eq('count_id', countId)
        .not('actual_quantity', 'is', null);

      if (countError) throw countError;
      if (!countItems?.length) return;

      // Get count organization for audit trail
      const { data: count, error: countQueryError } = await supabase
        .from('inventory_counts')
        .select('organization_id')
        .eq('id', countId)
        .single();

      if (countQueryError) throw countQueryError;

      const stockUpdates = [];
      const adjustmentRecords = [];
      const { data: user } = await supabase.auth.getUser();

      for (const item of countItems) {
        const actualQuantity = item.actual_quantity;
        const inStockQuantity = item.in_stock_quantity || 0;
        const adjustment = actualQuantity - inStockQuantity;

        // Update warehouse stock
        stockUpdates.push(
          supabase
            .from('inventory_items')
            .update({ 
              current_stock: actualQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.item_id)
        );

        // Create adjustment record if there's a difference
        if (Math.abs(adjustment) > 0.01) {
          adjustmentRecords.push({
            organization_id: count.organization_id,
            item_id: item.item_id,
            count_id: countId,
            previous_quantity: inStockQuantity,
            new_quantity: actualQuantity,
            adjustment_amount: adjustment,
            adjustment_reason: 'inventory_count_approval',
            created_by: user.user?.id,
          });
        }
      }

      // Execute stock updates
      await Promise.all(stockUpdates);

      // Create adjustment records
      if (adjustmentRecords.length > 0) {
        const { error: adjustmentError } = await supabase
          .from('warehouse_stock_adjustments')
          .insert(adjustmentRecords);

        if (adjustmentError) {
          console.error('Failed to create adjustment records:', adjustmentError);
        }
      }

      // Mark count as warehouse updated
      await supabase
        .from('inventory_counts')
        .update({ warehouse_updated: true })
        .eq('id', countId);

    } catch (error) {
      console.error('Error updating warehouse from count:', error);
      throw error;
    }
  };

  return {
    approveCount,
    isApproving,
  };
};