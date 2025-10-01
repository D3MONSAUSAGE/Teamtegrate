import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { generatedLabelsApi, manufacturingBatchesApi, labelTemplatesApi } from '@/contexts/inventory/api';
import { validateUUID } from '@/utils/uuidValidation';

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
      // Validate and resolve all UUID fields
      const validatedItemId = validateUUID(data.itemId);
      if (!validatedItemId) {
        throw new Error('Invalid item ID provided');
      }

      const validatedLotId = data.lotId ? validateUUID(data.lotId) : null;
      const validatedOrgId = validateUUID(user.organizationId);
      const validatedUserId = validateUUID(user.id);

      if (!validatedOrgId || !validatedUserId) {
        throw new Error('Invalid user or organization ID');
      }

      // Resolve template_id - handle string categories or fetch default
      let templateId = data.labelData.templateId;
      
      // Check if templateId is a valid UUID
      const validatedTemplateId = templateId ? validateUUID(templateId) : null;
      
      if (!validatedTemplateId) {
        console.log('No valid template ID provided, fetching templates...');
        const templates = await labelTemplatesApi.getAll();
        
        if (templates.length === 0) {
          throw new Error('No label templates found. Please create a template first.');
        }
        
        // If templateId is a category string (like "food"), try to find matching template
        if (templateId && typeof templateId === 'string') {
          const matchingTemplate = templates.find(
            t => t.category?.toLowerCase() === templateId.toLowerCase() || 
                 t.name?.toLowerCase().includes(templateId.toLowerCase())
          );
          templateId = matchingTemplate?.id || templates[0].id;
          console.log(`Mapped category "${data.labelData.templateId}" to template:`, templateId);
        } else {
          // Use first available template
          templateId = templates[0].id;
          console.log('Using first available template:', templateId);
        }
      } else {
        templateId = validatedTemplateId;
      }

      // Save the generated label record with validated UUIDs
      const labelRecord = await generatedLabelsApi.create({
        organization_id: validatedOrgId,
        template_id: templateId,
        item_id: validatedItemId,
        lot_id: validatedLotId,
        label_data: data.labelData,
        print_format: data.printFormat,
        quantity_printed: data.quantityPrinted,
        printed_by: validatedUserId,
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
