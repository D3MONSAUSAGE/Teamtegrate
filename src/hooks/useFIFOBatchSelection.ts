import { useCallback } from 'react';
import { ManufacturingBatch } from '@/contexts/inventory/api';

type SelectionMethod = 'FIFO' | 'FEFO' | 'LIFO';

export const useFIFOBatchSelection = () => {
  /**
   * Select batches using FIFO (First In, First Out) method
   */
  const selectBatchesFIFO = useCallback((
    batches: ManufacturingBatch[],
    requiredQuantity: number
  ): { selectedBatches: Array<{ batch: ManufacturingBatch; quantity: number }>; totalSelected: number } => {
    // Sort by manufacturing date (oldest first)
    const sortedBatches = [...batches]
      .filter(b => b.quantity_remaining > 0)
      .sort((a, b) => new Date(a.manufacturing_date).getTime() - new Date(b.manufacturing_date).getTime());

    const selectedBatches: Array<{ batch: ManufacturingBatch; quantity: number }> = [];
    let remaining = requiredQuantity;

    for (const batch of sortedBatches) {
      if (remaining <= 0) break;

      const quantityToTake = Math.min(batch.quantity_remaining, remaining);
      selectedBatches.push({
        batch,
        quantity: quantityToTake,
      });

      remaining -= quantityToTake;
    }

    return {
      selectedBatches,
      totalSelected: requiredQuantity - remaining,
    };
  }, []);

  /**
   * Select batches using FEFO (First Expired, First Out) method
   */
  const selectBatchesFEFO = useCallback((
    batches: ManufacturingBatch[],
    requiredQuantity: number,
    getExpirationDate?: (batch: ManufacturingBatch) => Date | null
  ): { selectedBatches: Array<{ batch: ManufacturingBatch; quantity: number }>; totalSelected: number } => {
    // Sort by expiration date (earliest expiration first)
    const sortedBatches = [...batches]
      .filter(b => b.quantity_remaining > 0)
      .map(batch => ({
        batch,
        expirationDate: getExpirationDate ? getExpirationDate(batch) : null,
      }))
      .sort((a, b) => {
        // Prioritize batches with expiration dates
        if (!a.expirationDate && !b.expirationDate) {
          // Both no expiration - use FIFO as fallback
          return new Date(a.batch.manufacturing_date).getTime() - new Date(b.batch.manufacturing_date).getTime();
        }
        if (!a.expirationDate) return 1;
        if (!b.expirationDate) return -1;
        return a.expirationDate.getTime() - b.expirationDate.getTime();
      });

    const selectedBatches: Array<{ batch: ManufacturingBatch; quantity: number }> = [];
    let remaining = requiredQuantity;

    for (const { batch } of sortedBatches) {
      if (remaining <= 0) break;

      const quantityToTake = Math.min(batch.quantity_remaining, remaining);
      selectedBatches.push({
        batch,
        quantity: quantityToTake,
      });

      remaining -= quantityToTake;
    }

    return {
      selectedBatches,
      totalSelected: requiredQuantity - remaining,
    };
  }, []);

  /**
   * Select batches using LIFO (Last In, First Out) method
   */
  const selectBatchesLIFO = useCallback((
    batches: ManufacturingBatch[],
    requiredQuantity: number
  ): { selectedBatches: Array<{ batch: ManufacturingBatch; quantity: number }>; totalSelected: number } => {
    // Sort by manufacturing date (newest first)
    const sortedBatches = [...batches]
      .filter(b => b.quantity_remaining > 0)
      .sort((a, b) => new Date(b.manufacturing_date).getTime() - new Date(a.manufacturing_date).getTime());

    const selectedBatches: Array<{ batch: ManufacturingBatch; quantity: number }> = [];
    let remaining = requiredQuantity;

    for (const batch of sortedBatches) {
      if (remaining <= 0) break;

      const quantityToTake = Math.min(batch.quantity_remaining, remaining);
      selectedBatches.push({
        batch,
        quantity: quantityToTake,
      });

      remaining -= quantityToTake;
    }

    return {
      selectedBatches,
      totalSelected: requiredQuantity - remaining,
    };
  }, []);

  /**
   * Select batches using specified method
   */
  const selectBatches = useCallback((
    batches: ManufacturingBatch[],
    requiredQuantity: number,
    method: SelectionMethod = 'FIFO',
    getExpirationDate?: (batch: ManufacturingBatch) => Date | null
  ) => {
    switch (method) {
      case 'FIFO':
        return selectBatchesFIFO(batches, requiredQuantity);
      case 'FEFO':
        return selectBatchesFEFO(batches, requiredQuantity, getExpirationDate);
      case 'LIFO':
        return selectBatchesLIFO(batches, requiredQuantity);
      default:
        return selectBatchesFIFO(batches, requiredQuantity);
    }
  }, [selectBatchesFIFO, selectBatchesFEFO, selectBatchesLIFO]);

  /**
   * Get recommended batch selection for outbound operation
   */
  const getRecommendedBatches = useCallback((
    batches: ManufacturingBatch[],
    requiredQuantity: number,
    preferredMethod: SelectionMethod = 'FEFO'
  ) => {
    const result = selectBatches(batches, requiredQuantity, preferredMethod);
    
    return {
      ...result,
      isComplete: result.totalSelected >= requiredQuantity,
      shortfall: Math.max(0, requiredQuantity - result.totalSelected),
      recommendation: result.totalSelected < requiredQuantity
        ? `Insufficient stock: ${result.totalSelected}/${requiredQuantity} available`
        : `${result.selectedBatches.length} batch(es) selected using ${preferredMethod}`,
    };
  }, [selectBatches]);

  return {
    selectBatches,
    selectBatchesFIFO,
    selectBatchesFEFO,
    selectBatchesLIFO,
    getRecommendedBatches,
  };
};
