
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

interface TaskDialogActionsProps {
  isSubmitting: boolean;
  editingTask?: any;
  onCancel: () => void;
}

const TaskDialogActions: React.FC<TaskDialogActionsProps> = ({
  isSubmitting,
  editingTask,
  onCancel
}) => {
  return (
    <div className="flex justify-end gap-3 pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-6"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="px-6 bg-gradient-to-r from-primary to-emerald-500 hover:shadow-lg transition-all duration-200"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
            {editingTask ? 'Updating...' : 'Creating...'}
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            {editingTask ? 'Update Task' : 'Create Task'}
          </>
        )}
      </Button>
    </div>
  );
};

export default TaskDialogActions;
