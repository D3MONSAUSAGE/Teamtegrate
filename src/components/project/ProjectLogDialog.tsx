
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare } from 'lucide-react';
import ProjectCommentForm from './ProjectCommentForm';
import ProjectCommentsList from './ProjectCommentsList';
import { useProjectComments } from '@/hooks/useProjectComments';

interface ProjectLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
}

const ProjectLogDialog: React.FC<ProjectLogDialogProps> = ({
  open,
  onOpenChange,
  projectId,
  projectTitle
}) => {
  const { comments, loading, addComment } = useProjectComments(projectId);

  const handleAddComment = async (commentText: string) => {
    await addComment(commentText);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Project Updates - {projectTitle}
            {!loading && (
              <span className="text-sm font-normal text-muted-foreground">
                ({comments.length})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 max-h-[60vh]">
          {/* Comments List - Scrollable */}
          <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading project updates...
              </div>
            ) : (
              <ProjectCommentsList projectComments={comments} />
            )}
          </div>
          
          {/* Add Comment Form - Fixed at bottom */}
          <div className="border-t pt-4">
            <ProjectCommentForm 
              projectId={projectId} 
              onCommentAdded={handleAddComment}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectLogDialog;
