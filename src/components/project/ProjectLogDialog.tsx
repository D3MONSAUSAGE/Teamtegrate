
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TaskComment } from '@/types';
import { MessageSquare } from 'lucide-react';
import ProjectCommentForm from './ProjectCommentForm';
import ProjectCommentsList from './ProjectCommentsList';

interface ProjectLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
  projectComments: TaskComment[];
}

const ProjectLogDialog: React.FC<ProjectLogDialogProps> = ({
  open,
  onOpenChange,
  projectId,
  projectTitle,
  projectComments
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Project Updates - {projectTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 max-h-[60vh]">
          {/* Comments List - Scrollable */}
          <div className="flex-1 overflow-y-auto pr-2">
            <ProjectCommentsList projectComments={projectComments} />
          </div>
          
          {/* Add Comment Form - Fixed at bottom */}
          <div className="border-t pt-4">
            <ProjectCommentForm projectId={projectId} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectLogDialog;
