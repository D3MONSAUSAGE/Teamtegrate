import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { generatedLabelsApi, manufacturingBatchesApi } from '@/contexts/inventory/api';

interface LabelGenerationData {
  itemId: string;
  lotId?: string;
  batchId?: string;
  labelData: any;
  printFormat: string;
  quantityPrinted: number;
}

export const useLabelGeneration = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const recordLabelGeneration = async (data: LabelGenerationData) => {
    if (!user?.organizationId) {
      throw new Error('Organization not found');
    }

    setSaving(true);
    try {
      // Save the generated label record (template_id is optional, use null if not provided)
      const labelRecord = await generatedLabelsApi.create({
        organization_id: user.organizationId,
        template_id: data.labelData.templateId || null,
        item_id: data.itemId,
        lot_id: data.lotId,
        label_data: data.labelData,
        print_format: data.printFormat,
        quantity_printed: data.quantityPrinted,
        printed_by: user.id,
      });

      // If batch is linked, update the batch quantities
      if (data.batchId) {
        const batch = await manufacturingBatchesApi.getAll();
        const currentBatch = batch.find(b => b.id === data.batchId);
        
        if (currentBatch) {
          const newQuantityLabeled = currentBatch.quantity_labeled + data.quantityPrinted;
          const newQuantityRemaining = currentBatch.total_quantity_manufactured - newQuantityLabeled;

          // Validate we're not over-labeling
          if (newQuantityRemaining < 0) {
            throw new Error(`Cannot print ${data.quantityPrinted} labels. Only ${currentBatch.quantity_remaining} units remaining unlabeled.`);
          }

          await manufacturingBatchesApi.update(data.batchId, {
            quantity_labeled: newQuantityLabeled,
            quantity_remaining: newQuantityRemaining,
          });
        }
      }

      return labelRecord;
    } catch (error: any) {
      console.error('Failed to record label generation:', error);
      toast.error(error.message || 'Failed to record label generation');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    recordLabelGeneration,
    saving,
  };
};
