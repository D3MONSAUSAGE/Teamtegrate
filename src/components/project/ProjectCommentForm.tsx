
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCirclePlus } from 'lucide-react';

interface ProjectCommentFormProps {
  projectId: string;
  onCommentAdded?: (commentText: string) => Promise<void>;
}

const ProjectCommentForm: React.FC<ProjectCommentFormProps> = ({ 
  projectId, 
  onCommentAdded 
}) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      if (onCommentAdded) {
        await onCommentAdded(comment.trim());
      }
      setComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmitComment} className="space-y-3">
      <div className="space-y-2">
        <Textarea 
          placeholder="Add a project update..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="h-20 resize-none"
          disabled={isSubmitting}
        />
      </div>
      <Button 
        type="submit"
        disabled={!comment.trim() || isSubmitting}
        className="flex items-center gap-2"
      >
        <MessageCirclePlus className="h-4 w-4" />
        {isSubmitting ? 'Adding...' : 'Add Update'}
      </Button>
    </form>
  );
};

export default ProjectCommentForm;
