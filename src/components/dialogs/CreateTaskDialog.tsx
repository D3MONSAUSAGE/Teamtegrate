
import React from 'react';
import { Task } from '@/types';
import NewCreateTaskDialog from './NewCreateTaskDialog';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task;
  onSubmit: (taskData: any) => Promise<void>;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = (props) => {
  return <NewCreateTaskDialog {...props} />;
};

export default CreateTaskDialog;
