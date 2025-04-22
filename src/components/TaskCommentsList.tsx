
import React from 'react';
import { TaskComment } from '@/types';

export interface TaskCommentsListProps {
  taskComments: TaskComment[];
  className?: string;
}

const TaskCommentsList: React.FC<TaskCommentsListProps> = ({ taskComments, className }) => {
  if (!taskComments || taskComments.length === 0) {
    return <div className={`text-sm text-muted-foreground ${className}`}>No comments yet.</div>;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {taskComments.map((comment) => (
        <div key={comment.id} className="bg-muted/50 p-3 rounded-md">
          <div className="flex justify-between items-start mb-1">
            <div className="font-medium text-sm">{comment.userName}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="text-sm">{comment.text}</div>
        </div>
      ))}
    </div>
  );
};

export default TaskCommentsList;
