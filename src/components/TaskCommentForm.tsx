
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/contexts/AuthContext';
import { MessageCirclePlus } from 'lucide-react';

interface TaskCommentFormProps {
  taskId: string;
  onCommentAdd?: (taskId: string, commentText: string) => Promise<void>;
}

const TaskCommentForm: React.FC<TaskCommentFormProps> = ({ taskId, onCommentAdd }) => {
  const [comment, setComment] = useState('');
  const { user } = useAuth();
  
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim() || !user || !onCommentAdd) return;
    
    try {
      await onCommentAdd(taskId, comment);
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
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
        disabled={!comment.trim() || !onCommentAdd}
        className="flex items-center gap-2"
      >
        <MessageCirclePlus className="h-4 w-4" />
        Add Comment
      </Button>
    </form>
  );
};

export default TaskCommentForm;
