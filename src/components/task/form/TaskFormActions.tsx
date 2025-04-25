
import React from 'react';
import { Button } from "@/components/ui/button";

interface TaskFormActionsProps {
  isEditMode: boolean;
  onCancel: () => void;
  isMobile: boolean;
}

const TaskFormActions: React.FC<TaskFormActionsProps> = ({ 
  isEditMode, 
  onCancel,
  isMobile 
}) => {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel}
        size={isMobile ? "sm" : "default"}
      >
        Cancel
      </Button>
      <Button 
        type="submit"
        size={isMobile ? "sm" : "default"}
      >
        {isEditMode ? 'Update' : 'Create'}
      </Button>
    </div>
  );
};

export default TaskFormActions;
