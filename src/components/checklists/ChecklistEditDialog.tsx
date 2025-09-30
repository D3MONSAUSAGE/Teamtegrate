import React, { useEffect, useState } from 'react';
import { useChecklistTemplateV2 } from '@/hooks/useChecklistTemplatesV2';
import { ChecklistCreationDialog } from './ChecklistCreationDialog';
import { Checklist } from '@/types/checklist';

interface ChecklistEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklistId: string | null;
}

export const ChecklistEditDialog: React.FC<ChecklistEditDialogProps> = ({
  open,
  onOpenChange,
  checklistId,
}) => {
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const { data: template, isLoading } = useChecklistTemplateV2(checklistId);

  useEffect(() => {
    if (template && open) {
      // Transform to match expected format
      const transformedTemplate = {
        ...template,
        scheduled_days: Array.isArray(template.scheduled_days) 
          ? template.scheduled_days 
          : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      };
      setEditingChecklist(transformedTemplate as any);
    }
  }, [template, open]);

  if (isLoading || !editingChecklist) {
    return null;
  }

  return (
    <ChecklistCreationDialog
      open={open}
      onOpenChange={onOpenChange}
      editingChecklist={editingChecklist}
    />
  );
};