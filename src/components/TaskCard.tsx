
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Task, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";
import TaskCommentsDialog from "./TaskCommentsDialog";
import TaskDetailDrawer from "./task/TaskDetailDrawer";
import TaskCardHeader from "./task/TaskCardHeader";
import TaskCardActions from "./task/TaskCardActions";
import TaskCardDescription from "./task/TaskCardDescription";
import TaskCardMetadata from "./task/TaskCardMetadata";
import TaskCardFooter from "./task/TaskCardFooter";
import { useTask } from "@/contexts/task";
import { Eye } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onAssign?: (task: Task) => void;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onAssign,
  onClick,
}) => {
  const { updateTaskStatus, deleteTask } = useTask();
  const [showComments, setShowComments] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  const getPriorityBackground = (priority: string) => {
    switch (priority) {
      case "Low":
        return "bg-blue-50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800";
      case "Medium":
        return "bg-amber-50 dark:bg-amber-900/10 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-800";
      case "High":
        return "bg-rose-50 dark:bg-rose-900/10 text-rose-900 dark:text-rose-100 border-rose-200 dark:border-rose-800";
      default:
        return "bg-blue-50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800";
    }
  };

  const isTaskOverdue = () => {
    const now = new Date();
    return task.status !== "Completed" && task.deadline < now;
  };

  const commentCount = task.comments?.length || 0;

  const handleStatusChange = (newStatus: TaskStatus) => {
    updateTaskStatus(task.id, newStatus);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  return (
    <>
      <Card
        className={cn(
          "card-hover cursor-pointer border-2 relative overflow-visible transition-shadow duration-400 hover:shadow-lg hover:scale-[1.018] hover:z-10 hover:border-primary/80",
          getPriorityBackground(task.priority),
          isTaskOverdue() && "ring-2 ring-red-500 dark:ring-red-400"
        )}
        onClick={onClick}
        tabIndex={0}
        aria-label={`Open details for ${task.title}`}
        role="button"
      >
        {/* Eye/View Icon with better styling */}
        <div className="absolute bottom-2 right-2 z-20">
          <button
            className={cn(
              "bg-gradient-to-br from-primary/60 to-emerald-400/70 dark:from-primary/30 dark:to-emerald-700/50 p-2 rounded-full shadow-lg border-2 border-white/80 hover:scale-105 transition-transform duration-200 focus:ring-2 focus:ring-primary",
              "flex items-center justify-center"
            )}
            aria-label="View Task"
            onClick={e => {
              e.stopPropagation();
              setShowDrawer(true);
            }}
            type="button"
          >
            <Eye className="h-5 w-5 text-white drop-shadow" />
          </button>
        </div>
        {/* Card header, content, and floating menu */}
        <TaskCardHeader title={task.title} priority={task.priority} />
        <CardContent className="space-y-2 pt-0 md:pt-1 px-4 md:px-6 pb-5">
          <TaskCardDescription description={task.description} />
          <TaskCardMetadata
            deadline={task.deadline}
            assignedToName={task.assignedToName}
          />
          <TaskCardFooter
            status={task.status}
            isOverdue={isTaskOverdue()}
            commentCount={commentCount}
            onShowComments={() => setShowComments(true)}
            onStatusChange={handleStatusChange}
          />
        </CardContent>
        <div className="absolute top-1 right-1">
          <TaskCardActions
            task={task}
            onEdit={onEdit}
            onAssign={onAssign}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTask}
            onShowComments={() => setShowComments(true)}
          />
        </div>
      </Card>
      <TaskCommentsDialog
        open={showComments}
        onOpenChange={setShowComments}
        task={task}
      />
      <TaskDetailDrawer
        open={showDrawer}
        onOpenChange={setShowDrawer}
        task={task}
      />
    </>
  );
};

export default TaskCard;
