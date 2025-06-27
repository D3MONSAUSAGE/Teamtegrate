
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Clock } from 'lucide-react';
import ProjectCommentForm from './ProjectCommentForm';
import ProjectCommentsList from './ProjectCommentsList';
import { useProjectComments } from '@/hooks/useProjectComments';

interface ProjectLogSectionProps {
  projectId: string;
  className?: string;
}

const ProjectLogSection: React.FC<ProjectLogSectionProps> = ({
  projectId,
  className
}) => {
  const { comments, loading, addComment } = useProjectComments(projectId);
  const recentUpdates = comments.slice(0, 3);

  const handleAddComment = async (commentText: string) => {
    await addComment(commentText);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Project Updates
          {!loading && (
            <span className="text-sm font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recent Updates Preview */}
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading updates...</div>
        ) : recentUpdates.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Recent Updates
            </div>
            <ProjectCommentsList 
              projectComments={recentUpdates} 
              className="space-y-2"
            />
            {comments.length > 3 && (
              <div className="text-xs text-muted-foreground text-center">
                +{comments.length - 3} more updates
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            No project updates yet. Be the first to share an update!
          </div>
        )}
        
        {/* Add Update Form */}
        <div className="border-t pt-4">
          <ProjectCommentForm 
            projectId={projectId} 
            onCommentAdded={handleAddComment}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectLogSection;
