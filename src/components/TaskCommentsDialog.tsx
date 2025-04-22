
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Task } from '@/types';
import TaskCommentForm from './TaskCommentForm';
import TaskCommentsList from './TaskCommentsList';
import { MessageCircle } from 'lucide-react';
import { fetchComments } from '@/utils/comments';

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
  const [comments, setComments] = useState(task?.comments || []);

  const loadComments = async () => {
    if (task) {
      const fetchedComments = await fetchComments(task.id);
      setComments(fetchedComments);
    }
  };

  useEffect(() => {
    if (open && task) {
      loadComments();
    }
  }, [open, task]);

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
        
        <div className="max-h-[60vh] overflow-y-auto p-1">
          <TaskCommentsList 
            taskComments={comments} 
            onCommentDeleted={loadComments}
            onCommentUpdated={loadComments}
          />
          <TaskCommentForm 
            taskId={task.id} 
            onCommentAdded={loadComments}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskCommentsDialog;
