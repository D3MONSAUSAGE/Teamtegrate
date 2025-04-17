
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Task } from '@/types';
import TaskCommentForm from './TaskCommentForm';
import TaskCommentsList from './TaskCommentsList';
import { MessageCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments on "{task.title}"
          </DialogTitle>
        </DialogHeader>
        
        <Separator className="my-2" />
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <TaskCommentsList taskComments={task.comments || []} />
            <Separator className="my-2" />
            <TaskCommentForm taskId={task.id} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TaskCommentsDialog;
