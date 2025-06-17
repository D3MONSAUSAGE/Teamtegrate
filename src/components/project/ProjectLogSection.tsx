
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Clock } from 'lucide-react';
import { TaskComment } from '@/types';
import ProjectCommentForm from './ProjectCommentForm';
import ProjectCommentsList from './ProjectCommentsList';

interface ProjectLogSectionProps {
  projectId: string;
  projectComments: TaskComment[];
  className?: string;
}

const ProjectLogSection: React.FC<ProjectLogSectionProps> = ({
  projectId,
  projectComments,
  className
}) => {
  const recentUpdates = projectComments.slice(0, 3);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Project Updates
          <span className="text-sm font-normal text-muted-foreground">
            ({projectComments.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recent Updates Preview */}
        {recentUpdates.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Recent Updates
            </div>
            <ProjectCommentsList 
              projectComments={recentUpdates} 
              className="space-y-2"
            />
            {projectComments.length > 3 && (
              <div className="text-xs text-muted-foreground text-center">
                +{projectComments.length - 3} more updates
              </div>
            )}
          </div>
        )}
        
        {/* Add Update Form */}
        <div className="border-t pt-4">
          <ProjectCommentForm projectId={projectId} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectLogSection;
