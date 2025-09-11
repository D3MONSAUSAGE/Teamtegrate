import React, { useEffect, useState } from 'react';
import { useChecklist } from '@/hooks/useChecklists';
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
  const { data: checklist, isLoading } = useChecklist(checklistId || '');

  useEffect(() => {
    if (checklist && open) {
      // Transform the checklist data to match expected format
      const transformedChecklist = {
        ...checklist,
        scheduled_days: Array.isArray(checklist.scheduled_days) 
          ? checklist.scheduled_days 
          : JSON.parse(checklist.scheduled_days as string) || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      };
      setEditingChecklist(transformedChecklist);
    }
  }, [checklist, open]);

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