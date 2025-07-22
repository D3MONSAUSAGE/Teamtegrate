
import React from 'react';
import { Task } from '@/types';
import NewCommentsDialog from './NewCommentsDialog';

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

const CommentsDialog: React.FC<CommentsDialogProps> = (props) => {
  return <NewCommentsDialog {...props} />;
};

export default CommentsDialog;
