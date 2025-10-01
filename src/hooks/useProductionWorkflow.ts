import { useCallback } from 'react';
import { useBatchAutoGeneration } from './useBatchAutoGeneration';
import { toast } from '@/hooks/use-toast';

interface ProductionWorkflowOptions {
  autoCreateBatches?: boolean;
  productionLine?: string;
  batchThreshold?: number; // Minimum quantity to trigger batch creation
}

export const useProductionWorkflow = (options?: ProductionWorkflowOptions) => {
  const { autoGenerateBatch } = useBatchAutoGeneration();
  
  const defaultOptions = {
    autoCreateBatches: true,
    batchThreshold: 1,
    ...options,
  };

  /**
   * Process incoming stock and auto-generate manufacturing batch if conditions are met
   */
  const processIncomingStock = useCallback(async (
    itemId: string,
    quantity: number,
    metadata?: {
      productionLine?: string;
      lotId?: string;
      isProduction?: boolean;
      manufacturingDate?: string;
    }
  ) => {
    // Only auto-generate if this is marked as production or quantity meets threshold
    if (!defaultOptions.autoCreateBatches) {
      return null;
    }

    if (quantity < defaultOptions.batchThreshold) {
      console.log(`Quantity ${quantity} below threshold ${defaultOptions.batchThreshold}, skipping batch creation`);
      return null;
    }

    // Auto-generate batch for production incoming stock
    if (metadata?.isProduction !== false) {
      try {
        const batch = await autoGenerateBatch(itemId, quantity, {
          productionLine: metadata?.productionLine || defaultOptions.productionLine,
          lotId: metadata?.lotId,
        });

        if (batch) {
          console.log(`✅ Auto-generated batch ${batch.batch_number} for ${quantity} units`);
          return batch;
        }
      } catch (error) {
        console.error('Failed to auto-generate batch:', error);
      }
    }

    return null;
  }, [autoGenerateBatch, defaultOptions]);

  /**
   * Process finished goods transaction
   */
  const processFinishedGoods = useCallback(async (
    itemId: string,
    quantity: number,
    productionLine?: string,
    lotId?: string
  ) => {
    if (!defaultOptions.autoCreateBatches || quantity < defaultOptions.batchThreshold) {
      return null;
    }

    const batch = await autoGenerateBatch(itemId, quantity, {
      productionLine: productionLine || defaultOptions.productionLine,
      lotId,
    });

    if (batch) {
      toast({
        title: 'Batch Auto-Created',
        description: `Manufacturing batch ${batch.batch_number} created for ${quantity} units`,
      });
    }

    return batch;
  }, [autoGenerateBatch, defaultOptions, toast]);

  /**
   * Calculate raw material consumption and suggest batch size
   */
  const calculateProductionYield = useCallback((
    rawMaterialsUsed: { itemId: string; quantity: number }[],
    conversionRates?: Record<string, number>
  ) => {
    // This is a simplified calculation - you can enhance based on your specific needs
    const totalInput = rawMaterialsUsed.reduce((sum, rm) => {
      const rate = conversionRates?.[rm.itemId] || 1;
      return sum + (rm.quantity * rate);
    }, 0);

    // Assume 95% yield (5% waste)
    const expectedOutput = Math.floor(totalInput * 0.95);

    return {
      totalInput,
      expectedOutput,
      estimatedWaste: totalInput - expectedOutput,
    };
  }, []);

  /**
   * Validate if a transaction should trigger batch creation
   */
  const shouldCreateBatch = useCallback((
    transactionType: 'in' | 'out' | 'adjustment' | 'count',
    quantity: number,
    metadata?: { isProduction?: boolean }
  ) => {
    if (!defaultOptions.autoCreateBatches) return false;
    if (quantity < defaultOptions.batchThreshold) return false;
    
    // Only create batches for incoming production stock
    if (transactionType === 'in' && metadata?.isProduction !== false) {
      return true;
    }

    return false;
  }, [defaultOptions]);

  return {
    processIncomingStock,
    processFinishedGoods,
    calculateProductionYield,
    shouldCreateBatch,
  };
};
