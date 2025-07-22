
import React from 'react';
import { Task } from '@/types';
import NewTaskDetailDialog from './NewTaskDetailDialog';

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onOpenComments?: (task: Task) => void;
}

const TaskDetailDialog: React.FC<TaskDetailDialogProps> = (props) => {
  return <NewTaskDetailDialog {...props} />;
};

export default TaskDetailDialog;
