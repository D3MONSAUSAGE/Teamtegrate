
import React, { useState } from 'react';
import { Task } from '@/types';
import { MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/sonner';
import UniversalDialog from './UniversalDialog';
import TaskCommentsList from '@/components/TaskCommentsList';

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

const CommentsDialog: React.FC<CommentsDialogProps> = ({
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
      toast.success('Comment added');
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
    <UniversalDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Comments"
      description={`Discussion for "${task.title}"`}
      variant="sheet"
    >
      <div className="flex flex-col h-full">
        {/* Comments List */}
        <ScrollArea className="flex-1 p-6">
          {task.comments && task.comments.length > 0 ? (
            <div className="space-y-4">
              <TaskCommentsList taskComments={task.comments} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No comments yet</h3>
              <p className="text-sm text-muted-foreground">
                Be the first to share your thoughts!
              </p>
            </div>
          )}
        </ScrollArea>
        
        {/* Comment Input - Fixed at bottom */}
        <div className="p-6 border-t border-border/50 bg-muted/20">
          <div className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Write a comment..."
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
                className="h-10 px-6"
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
    </UniversalDialog>
  );
};

export default CommentsDialog;
