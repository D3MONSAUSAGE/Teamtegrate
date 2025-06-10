
import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface TaskFormActionsProps {
  isEditMode: boolean;
  onCancel: () => void;
}

const TaskFormActions: React.FC<TaskFormActionsProps> = ({
  isEditMode,
  onCancel
}) => {
  return (
    <div className="flex justify-end gap-3 pt-6 border-t border-border/30">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel}
        className="hover:bg-muted/50 transition-colors"
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        {isEditMode ? 'Update Task' : 'Create Task'}
      </Button>
    </div>
  );
};

export default TaskFormActions;
