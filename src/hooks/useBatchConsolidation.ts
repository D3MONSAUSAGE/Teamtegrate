import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useBatchConsolidation = () => {
  const { user } = useAuth();

  /**
   * Consolidate multiple batches into a single master batch
   */
  const consolidateBatches = useCallback(async (
    batchIds: string[],
    consolidatedBatchNumber?: string
  ) => {
    if (!user?.organizationId || batchIds.length < 2) {
      return null;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');

      // Get all batches to consolidate
      const { data: batches, error: fetchError } = await supabase
        .from('manufacturing_batches')
        .select('*')
        .in('id', batchIds);

      if (fetchError) throw fetchError;
      if (!batches || batches.length === 0) {
        throw new Error('No batches found to consolidate');
      }

      // Calculate totals
      const totalQuantity = batches.reduce((sum, b) => sum + b.total_quantity_manufactured, 0);
      const totalLabeled = batches.reduce((sum, b) => sum + b.quantity_labeled, 0);
      const totalDistributed = batches.reduce((sum, b) => sum + b.quantity_distributed, 0);
      const totalRemaining = batches.reduce((sum, b) => sum + b.quantity_remaining, 0);

      // Use earliest manufacturing date
      const earliestDate = batches
        .map(b => new Date(b.manufacturing_date))
        .sort((a, b) => a.getTime() - b.getTime())[0];

      // Get lot_id from first batch (assuming same lot)
      const lotId = batches[0].lot_id;

      // Generate consolidated batch number if not provided
      let finalBatchNumber = consolidatedBatchNumber;
      if (!finalBatchNumber) {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        finalBatchNumber = `CONSOL-${year}-${month}-${batchIds.length}BATCH`;
      }

      // Create consolidated batch
      const { data: consolidatedBatch, error: createError } = await supabase
        .from('manufacturing_batches')
        .insert([{
          organization_id: user.organizationId,
          lot_id: lotId,
          batch_number: finalBatchNumber,
          total_quantity_manufactured: totalQuantity,
          quantity_labeled: totalLabeled,
          quantity_distributed: totalDistributed,
          quantity_remaining: totalRemaining,
          manufacturing_date: earliestDate.toISOString().split('T')[0],
          production_notes: `Consolidated from ${batchIds.length} batches: ${batches.map(b => b.batch_number).join(', ')}`,
          created_by: user.id,
        }])
        .select()
        .single();

      if (createError) throw createError;

      // Mark original batches as consolidated (soft delete or mark inactive)
      const { error: updateError } = await supabase
        .from('manufacturing_batches')
        .update({
          production_notes: `Consolidated into batch ${finalBatchNumber}`,
          quantity_remaining: 0,
        })
        .in('id', batchIds);

      if (updateError) throw updateError;

      toast({
        title: 'Batches Consolidated',
        description: `${batchIds.length} batches consolidated into ${finalBatchNumber}`,
      });

      return consolidatedBatch;
    } catch (error) {
      console.error('Error consolidating batches:', error);
      toast({
        title: 'Consolidation Failed',
        description: 'Failed to consolidate batches',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  /**
   * Split a large batch into multiple smaller batches
   */
  const splitBatch = useCallback(async (
    batchId: string,
    splitQuantities: number[]
  ) => {
    if (!user?.organizationId || splitQuantities.length === 0) {
      return null;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');

      // Get original batch
      const { data: originalBatch, error: fetchError } = await supabase
        .from('manufacturing_batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (fetchError) throw fetchError;

      const totalSplit = splitQuantities.reduce((sum, qty) => sum + qty, 0);
      if (totalSplit > originalBatch.quantity_remaining) {
        throw new Error('Split quantities exceed available quantity');
      }

      // Create split batches
      const splitBatches = [];
      for (let i = 0; i < splitQuantities.length; i++) {
        const splitBatchNumber = `${originalBatch.batch_number}-S${i + 1}`;
        
        const { data: newBatch } = await supabase
          .from('manufacturing_batches')
          .insert([{
            organization_id: user.organizationId,
            lot_id: originalBatch.lot_id,
            batch_number: splitBatchNumber,
            total_quantity_manufactured: splitQuantities[i],
            quantity_remaining: splitQuantities[i],
            manufacturing_date: originalBatch.manufacturing_date,
            manufacturing_shift: originalBatch.manufacturing_shift,
            production_line: originalBatch.production_line,
            production_notes: `Split from batch ${originalBatch.batch_number}`,
            created_by: user.id,
          }])
          .select()
          .single();

        if (newBatch) splitBatches.push(newBatch);
      }

      // Update original batch
      await supabase
        .from('manufacturing_batches')
        .update({
          quantity_remaining: originalBatch.quantity_remaining - totalSplit,
          production_notes: `${originalBatch.production_notes || ''}\nSplit into ${splitQuantities.length} batches`,
        })
        .eq('id', batchId);

      toast({
        title: 'Batch Split',
        description: `Split into ${splitQuantities.length} new batches`,
      });

      return splitBatches;
    } catch (error) {
      console.error('Error splitting batch:', error);
      toast({
        title: 'Split Failed',
        description: 'Failed to split batch',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  return {
    consolidateBatches,
    splitBatch,
  };
};
