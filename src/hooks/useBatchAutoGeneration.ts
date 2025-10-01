import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface BatchGenerationOptions {
  productionLine?: string;
  shift?: string;
  lotId?: string;
}

export const useBatchAutoGeneration = () => {
  const { user } = useAuth();

  const generateBatchNumber = useCallback(async (options?: BatchGenerationOptions) => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    
    // Get sequence number from database
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data: batches } = await supabase
      .from('manufacturing_batches')
      .select('batch_number')
      .like('batch_number', `BATCH-${year}-${month}%`)
      .order('created_at', { ascending: false })
      .limit(1);
    
    let sequence = 1;
    if (batches && batches.length > 0) {
      const lastBatch = batches[0].batch_number;
      const match = lastBatch.match(/BATCH-\d{4}-\d{2}-(\d+)/);
      if (match) {
        sequence = parseInt(match[1]) + 1;
      }
    }
    
    const sequenceStr = String(sequence).padStart(4, '0');
    let batchNumber = `BATCH-${year}-${month}-${sequenceStr}`;
    
    if (options?.productionLine) {
      batchNumber += `-${options.productionLine.replace(/\s+/g, '')}`;
    }
    
    return batchNumber;
  }, []);

  const getCurrentShift = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 'morning';
    if (hour >= 14 && hour < 22) return 'afternoon';
    return 'night';
  }, []);

  const autoGenerateBatch = useCallback(async (
    itemId: string,
    quantity: number,
    options?: BatchGenerationOptions
  ) => {
    if (!user?.organizationId || !user?.id) return null;

    const userId = user.id;
    const organizationId = user.organizationId;

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Get item details
      const { data: item } = await supabase
        .from('inventory_items')
        .select('*, inventory_lots(*)')
        .eq('id', itemId)
        .single();

      if (!item) return null;

      // Get the latest lot for this item
      const latestLot = Array.isArray(item.inventory_lots) && item.inventory_lots.length > 0 
        ? item.inventory_lots[0] 
        : null;
      const lotId = options?.lotId || (latestLot as any)?.id || null;

      const batchNumber = await generateBatchNumber(options);
      const shift = options?.shift || getCurrentShift();

      const { data: batch, error } = await supabase
        .from('manufacturing_batches')
        .insert([{
          organization_id: organizationId,
          lot_id: lotId,
          batch_number: batchNumber,
          total_quantity_manufactured: quantity,
          quantity_remaining: quantity,
          manufacturing_date: new Date().toISOString().split('T')[0],
          manufacturing_shift: shift,
          production_line: options?.productionLine || null,
          production_notes: 'Auto-generated from inventory transaction',
          created_by: userId,
        }])
        .select()
        .single();

      if (error) throw error;

      return batch;
    } catch (error) {
      console.error('Error auto-generating batch:', error);
      return null;
    }
  }, [user, generateBatchNumber, getCurrentShift]);

  return {
    generateBatchNumber,
    getCurrentShift,
    autoGenerateBatch,
  };
};
