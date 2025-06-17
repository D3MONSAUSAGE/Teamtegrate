
import React from 'react';
import { TaskComment } from '@/types';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';

export interface ProjectCommentsListProps {
  projectComments: TaskComment[];
  className?: string;
}

const ProjectCommentsList: React.FC<ProjectCommentsListProps> = ({ 
  projectComments, 
  className 
}) => {
  if (!projectComments || projectComments.length === 0) {
    return (
      <div className={`text-sm text-muted-foreground text-center py-4 ${className}`}>
        No project updates yet. Be the first to share an update!
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {projectComments.map((comment) => (
        <div key={comment.id} className="bg-muted/30 p-4 rounded-lg border">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {comment.userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start">
                <div className="font-medium text-sm">{comment.userName}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </div>
              </div>
              <div className="text-sm leading-relaxed">{comment.text}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectCommentsList;
