
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/task';
import { MessageCirclePlus } from 'lucide-react';
import { TaskComment } from '@/types';

interface TaskCommentFormProps {
  taskId: string;
  onCommentAdded?: (comment: TaskComment) => void;
}

const TaskCommentForm: React.FC<TaskCommentFormProps> = ({ taskId, onCommentAdded }) => {
  const [comment, setComment] = useState('');
  const { user } = useAuth();
  const { addCommentToTask } = useTask();
  
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim() || !user) return;
    
    const newComment = await addCommentToTask(taskId, {
      userId: user.id,
      userName: user.name || user.email,
      text: comment
    });
    
    if (newComment) {
      setComment('');
      onCommentAdded?.(newComment);
    }
  };
  
  return (
    <form onSubmit={handleSubmitComment} className="space-y-3 mt-4">
      <div className="space-y-2">
        <Textarea 
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="h-20 resize-none"
        />
      </div>
      <Button 
        type="submit"
        disabled={!comment.trim()}
        className="flex items-center gap-2"
      >
        <MessageCirclePlus className="h-4 w-4" />
        Add Comment
      </Button>
    </form>
  );
};

export default TaskCommentForm;
