
import React from "react";
import { MessageCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import TaskCommentForm from "@/components/TaskCommentForm";
import TaskCommentsList from "@/components/TaskCommentsList";
import { TaskComment } from "@/types";

interface TaskDetailCommentsProps {
  taskId: string;
  comments?: TaskComment[];
}

const TaskDetailComments: React.FC<TaskDetailCommentsProps> = ({ taskId, comments }) => {
  return (
    <>
      <Separator className="my-4" />
      <div className="space-y-2">
        <div className="font-medium text-sm flex items-center">
          <MessageCircle className="h-4 w-4 mr-2" />
          Comments
        </div>
        
        {comments && comments.length > 0 ? (
          <TaskCommentsList taskComments={comments} className="mt-2 max-h-40 overflow-y-auto" />
        ) : (
          <div className="text-sm text-muted-foreground mt-2">No comments yet</div>
        )}
        
        <TaskCommentForm taskId={taskId} />
      </div>
    </>
  );
};

export default TaskDetailComments;
