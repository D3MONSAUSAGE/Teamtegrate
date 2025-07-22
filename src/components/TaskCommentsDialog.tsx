
import React, { useState } from 'react';
import { Task } from '@/types';
import TaskCommentForm from './TaskCommentForm';
import TaskCommentsList from './TaskCommentsList';
import { MessageCircle, Send, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/sonner';
import MobileDialogWrapper from './mobile/MobileDialogWrapper';

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
    <MobileDialogWrapper
      open={open}
      onOpenChange={onOpenChange}
      title="Comments"
      subtitle={`Discussion for "${task.title}"`}
      variant="bottom-sheet"
      className="flex flex-col"
    >
      {/* Comments List */}
      <ScrollArea className="flex-1 px-6">
        <div className="py-6">
          {task.comments && task.comments.length > 0 ? (
            <div className="space-y-4">
              <TaskCommentsList taskComments={task.comments} />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No comments yet</h3>
              <p className="text-muted-foreground">
                Be the first to share your thoughts on this task!
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Comment Input - Fixed at bottom */}
      <div className="px-6 py-4 border-t border-border/50 bg-muted/10">
        <div className="bg-background rounded-2xl border border-border/50 p-4 shadow-sm">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your thoughts..."
            className="min-h-[80px] resize-none border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-muted-foreground/60"
            rows={3}
          />
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-muted/80"
              >
                <Smile className="h-4 w-4 text-muted-foreground" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {newComment.length}/500
              </span>
            </div>
            
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
              className="h-9 px-4 bg-gradient-to-r from-primary to-blue-500 hover:shadow-md transition-all duration-200"
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
        
        <div className="mt-3 px-2">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send, 
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Shift + Enter</kbd> for new line
          </p>
        </div>
      </div>
    </MobileDialogWrapper>
  );
};

export default TaskCommentsDialog;
