
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Task } from '@/types';
import TaskCommentForm from './TaskCommentForm';
import TaskCommentsList from './TaskCommentsList';
import { MessageCircle } from 'lucide-react';

interface TaskCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

const TaskCommentsDialog: React.FC<TaskCommentsDialogProps> = ({
  open,
  onOpenChange,
  task
}) => {
  if (!task) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm sm:max-w-md lg:max-w-[500px] max-h-[85vh] sm:max-h-[90vh] scrollbar-hide">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments on "{task.title}"
          </DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto scrollbar-hide p-1">
          <TaskCommentsList taskComments={task.comments || []} />
          <TaskCommentForm taskId={task.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskCommentsDialog;
