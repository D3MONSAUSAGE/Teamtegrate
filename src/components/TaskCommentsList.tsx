
import React from 'react';
import { Comment } from '@/types';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TaskCommentsListProps {
  comments?: Comment[];
}

const TaskCommentsList: React.FC<TaskCommentsListProps> = ({ comments = [] }) => {
  if (comments.length === 0) {
    return <p className="text-sm text-gray-500 italic mt-2">No comments yet</p>;
  }
  
  return (
    <div className="space-y-4 mt-2">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3 border-b pb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {comment.userName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between">
              <h4 className="text-sm font-medium">{comment.userName}</h4>
              <time className="text-xs text-gray-500">
                {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
              </time>
            </div>
            <p className="text-sm text-gray-700">{comment.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskCommentsList;
