
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import ProjectCommentForm from './ProjectCommentForm';
import ProjectCommentsList from './ProjectCommentsList';
import { useProjectComments } from '@/hooks/useProjectComments';

interface CollapsibleProjectLogSectionProps {
  projectId: string;
  className?: string;
  onViewAllClick?: () => void;
}

const CollapsibleProjectLogSection: React.FC<CollapsibleProjectLogSectionProps> = ({
  projectId,
  className,
  onViewAllClick
}) => {
  const { comments, loading, addComment } = useProjectComments(projectId);
  const [isExpanded, setIsExpanded] = useState(false);
  const recentUpdates = comments.slice(0, 3);

  const handleAddComment = async (commentText: string) => {
    await addComment(commentText);
    // Auto-expand when user adds a comment
    setIsExpanded(true);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Project Updates
            {!loading && (
              <span className="text-sm font-normal text-muted-foreground">
                ({comments.length})
              </span>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {comments.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAllClick}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Always show add comment form */}
        <div className="mb-4">
          <ProjectCommentForm 
            projectId={projectId} 
            onCommentAdded={handleAddComment}
          />
        </div>

        {/* Collapsible content */}
        {isExpanded && (
          <div className="space-y-4">
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
                    +{comments.length - 3} more updates available
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No project updates yet.
              </div>
            )}
          </div>
        )}
        
        {/* Collapsed state hint */}
        {!isExpanded && comments.length > 0 && (
          <div className="text-xs text-muted-foreground text-center py-2">
            Click to view recent updates
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CollapsibleProjectLogSection;
