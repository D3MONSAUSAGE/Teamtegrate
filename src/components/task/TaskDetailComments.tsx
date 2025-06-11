
import React from "react";
import { MessageCircle } from "lucide-react";
import TaskCommentsList from "@/components/TaskCommentsList";
import TaskCommentForm from "@/components/TaskCommentForm";
import { TaskComment } from '@/types';

interface TaskDetailCommentsProps {
  taskId: string;
  comments?: TaskComment[];
}

const TaskDetailComments: React.FC<TaskDetailCommentsProps> = ({
  taskId,
  comments,
}) => {
  // Add organizationId to comments if they don't have it
  const commentsWithOrgId = comments?.map(comment => ({
    ...comment,
    organizationId: comment.organizationId || 'default-org-id' // Provide fallback
  })) || [];

  return (
    <div className="p-4 pt-0 space-y-2">
      <div className="font-medium text-sm flex items-center">
        <MessageCircle className="h-4 w-4 mr-2" />
        Comments
      </div>
      {commentsWithOrgId.length > 0 ? (
        <TaskCommentsList
          taskComments={commentsWithOrgId}
          className="mt-2 max-h-40 overflow-y-auto"
        />
      ) : (
        <div className="text-sm text-muted-foreground mt-2">No comments yet</div>
      )}
      <TaskCommentForm taskId={taskId} />
    </div>
  );
};

export default TaskDetailComments;
