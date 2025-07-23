
import React, { useState } from 'react';
import { Task } from '@/types';
import TaskCommentsList from './TaskCommentsList';
import { MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/sonner';
import SimplifiedDialogWrapper from './mobile/SimplifiedDialogWrapper';

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
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!task) return null;

  const handleAddComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement actual comment submission
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };
  
  return (
    <SimplifiedDialogWrapper
      open={open}
      onOpenChange={onOpenChange}
      title="Comments"
      description={`Discussion for "${task.title}"`}
    >
      <div className="flex flex-col h-[500px]">
        {/* Comments List */}
        <ScrollArea className="flex-1 p-6 pb-4">
          {task.comments && task.comments.length > 0 ? (
            <div className="space-y-4">
              <TaskCommentsList taskComments={task.comments} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">No comments yet</h3>
              <p className="text-sm text-muted-foreground">
                Be the first to share your thoughts on this task!
              </p>
            </div>
          )}
        </ScrollArea>
        
        {/* Comment Input - Fixed at bottom */}
        <div className="p-6 pt-4 border-t bg-muted/10">
          <div className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thoughts..."
              className="min-h-[80px] resize-none"
              rows={3}
            />
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Press Enter to send, Shift + Enter for new line
              </span>
              
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-2" />
                ) : (
                  <Send className="h-3 w-3 mr-2" />
                )}
                {isSubmitting ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SimplifiedDialogWrapper>
  );
};

export default TaskCommentsDialog;
