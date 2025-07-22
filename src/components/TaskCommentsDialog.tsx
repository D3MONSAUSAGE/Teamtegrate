
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
      <DialogContent className="w-full max-w-[95vw] sm:max-w-md lg:max-w-[500px] 
                                 h-[90vh] sm:h-auto sm:max-h-[90vh] 
                                 fixed inset-x-4 inset-y-4 sm:inset-auto 
                                 sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]
                                 overflow-hidden flex flex-col
                                 safe-area-inset">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <MessageCircle className="h-5 w-5" />
            Comments on "{task.title}"
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-1 min-h-0">
          <TaskCommentsList taskComments={task.comments || []} />
          <TaskCommentForm taskId={task.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskCommentsDialog;
