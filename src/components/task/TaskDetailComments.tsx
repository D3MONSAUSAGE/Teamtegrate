
import React from "react";
import { MessageCircle } from "lucide-react";
import TaskCommentsList from "@/components/TaskCommentsList";
import TaskCommentForm from "@/components/TaskCommentForm";

interface TaskDetailCommentsProps {
  taskId: string;
  comments?: { id: string; userId: string; userName: string; text: string; createdAt: Date; }[];
}

const TaskDetailComments: React.FC<TaskDetailCommentsProps> = ({
  taskId,
  comments,
}) => (
  <div className="p-4 pt-0 space-y-2">
    <div className="font-medium text-sm flex items-center">
      <MessageCircle className="h-4 w-4 mr-2" />
      Comments
    </div>
    {comments && comments.length > 0 ? (
      <TaskCommentsList
        taskComments={comments}
        className="mt-2 max-h-40 overflow-y-auto"
      />
    ) : (
      <div className="text-sm text-muted-foreground mt-2">No comments yet</div>
    )}
    <TaskCommentForm taskId={taskId} />
  </div>
);

export default TaskDetailComments;
