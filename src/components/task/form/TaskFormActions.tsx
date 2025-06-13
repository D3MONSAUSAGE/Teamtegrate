
import React from 'react';
import { Button } from "@/components/ui/button";

interface TaskFormActionsProps {
  isEditMode: boolean;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const TaskFormActions: React.FC<TaskFormActionsProps> = ({
  isEditMode,
  onCancel,
  isSubmitting = false
}) => {
  return (
    <div className="flex justify-end gap-2 pt-4 border-t">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" 
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Task' : 'Create Task')}
      </Button>
    </div>
  );
};

export default TaskFormActions;
