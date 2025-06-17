
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/task';
import { MessageCirclePlus } from 'lucide-react';

interface ProjectCommentFormProps {
  projectId: string;
}

const ProjectCommentForm: React.FC<ProjectCommentFormProps> = ({ projectId }) => {
  const [comment, setComment] = useState('');
  const { user } = useAuth();
  const { addCommentToProject } = useTask();
  
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim() || !user) return;
    
    addCommentToProject(projectId, comment);
    
    setComment('');
  };
  
  return (
    <form onSubmit={handleSubmitComment} className="space-y-3">
      <div className="space-y-2">
        <Textarea 
          placeholder="Add a project update..."
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
        Add Update
      </Button>
    </form>
  );
};

export default ProjectCommentForm;
