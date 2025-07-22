
import React, { useState } from 'react';
import { Task } from '@/types';
import { MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import {
  CoreDialog,
  CoreDialogContent,
  CoreDialogHeader,
  CoreDialogBody,
  CoreDialogFooter,
  CoreDialogTitle,
  CoreDialogDescription
} from '@/components/ui/core-dialog';
import TaskCommentsList from '@/components/TaskCommentsList';

interface NewCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

const NewCommentsDialog: React.FC<NewCommentsDialogProps> = ({
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
    <CoreDialog open={open} onOpenChange={onOpenChange}>
      <CoreDialogContent variant="sheet">
        <CoreDialogHeader>
          <CoreDialogTitle>Comments</CoreDialogTitle>
          <CoreDialogDescription>
            Discussion for "{task.title}"
          </CoreDialogDescription>
        </CoreDialogHeader>

        <CoreDialogBody>
          {task.comments && task.comments.length > 0 ? (
            <div className="space-y-4">
              <TaskCommentsList taskComments={task.comments} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                <MessageCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">No comments yet</h3>
              <p className="text-base text-muted-foreground max-w-sm">
                Start the conversation by sharing your thoughts about this task!
              </p>
            </div>
          )}
        </CoreDialogBody>

        <CoreDialogFooter>
          <div className="flex flex-col gap-4 w-full">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Write a comment..."
              className="min-h-[100px] text-base resize-none"
              rows={4}
            />
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Press Enter to send, Shift + Enter for new line
              </span>
              
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || isSubmitting}
                size="lg"
                className="h-12 px-8 text-base font-medium"
              >
                {isSubmitting ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {isSubmitting ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </CoreDialogFooter>
      </CoreDialogContent>
    </CoreDialog>
  );
};

export default NewCommentsDialog;
