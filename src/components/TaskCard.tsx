
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Task, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";
import TaskDetailDrawer from "./task/TaskDetailDrawer";
import TaskCardHeader from "./task/TaskCardHeader";
import TaskCardActions from "./task/TaskCardActions";
import TaskCardDescription from "./task/TaskCardDescription";
import TaskCardMetadata from "./task/TaskCardMetadata";
import TaskCardFooter from "./task/TaskCardFooter";
import { useTask } from "@/contexts/task";
import { View } from "lucide-react";

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
  const [showDrawer, setShowDrawer] = useState(false);

  const getPriorityBackground = (priority: string) => {
    switch (priority) {
      case "Low":
        return "bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800";
      case "Medium":
        return "bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-100 border-amber-200 dark:border-amber-800";
      case "High":
        return "bg-rose-50 dark:bg-rose-900/10 text-rose-800 dark:text-rose-100 border-rose-200 dark:border-rose-800";
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

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowDrawer(true);
    }
  };

  // Clean up the assignedToName - if it looks like a UUID, treat it as "Unassigned"
  const assignedToName = task.assignedToName 
    ? (task.assignedToName.includes('-') && task.assignedToName.length > 20)
      ? "Unassigned" 
      : task.assignedToName
    : undefined;

  // Card styling improvements
  return (
    <>
      <Card
        className={cn(
          "relative transition-all duration-200 cursor-pointer rounded-xl overflow-hidden shadow ring-1 ring-border hover:shadow-lg border-0",
          getPriorityBackground(task.priority),
          isTaskOverdue() && "outline outline-2 outline-red-400 dark:outline-red-500",
        )}
        onClick={handleCardClick}
        tabIndex={0}
        aria-label={`Open details for ${task.title}`}
        role="button"
        style={{ minHeight: 190, marginBottom: 2 }}
      >
        {/* View Button */}
        <div className="absolute top-3 left-3 z-10">
          <button
            className="bg-white/70 dark:bg-card/90 p-1 rounded shadow hover:bg-white/90 dark:hover:bg-card outline-none border border-gray-200 focus:ring-2 focus:ring-primary"
            aria-label="View Task"
            onClick={e => {
              e.stopPropagation();
              setShowDrawer(true);
            }}
            type="button"
          >
            <View className="h-4 w-4 text-primary" />
          </button>
        </div>

        {/* Actions button (three dots) */}
        <div className="absolute top-2 right-2 z-10">
          <TaskCardActions
            task={task}
            onEdit={onEdit}
            onAssign={onAssign}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTask}
            onShowComments={() => setShowDrawer(true)}
          />
        </div>

        {/* Main Content */}
        <div className="pt-6 px-4 md:px-6 pb-2 flex flex-col gap-1">
          <TaskCardHeader title={task.title} priority={task.priority} />
          <CardContent className="space-y-2 p-0">
            <TaskCardDescription description={task.description} />
            <TaskCardMetadata
              deadline={task.deadline}
              assignedToName={assignedToName}
            />
            <TaskCardFooter
              status={task.status}
              isOverdue={isTaskOverdue()}
              commentCount={commentCount}
              onShowComments={() => setShowDrawer(true)}
              onStatusChange={handleStatusChange}
            />
          </CardContent>
        </div>
        {/* Overdue Label */}
        {isTaskOverdue() && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
            <span className="inline-block bg-red-500/90 text-white text-xs px-3 py-1 rounded-full shadow font-semibold tracking-wide">
              Overdue
            </span>
          </div>
        )}
      </Card>
      <TaskDetailDrawer
        open={showDrawer}
        onOpenChange={setShowDrawer}
        task={task}
      />
    </>
  );
};

export default TaskCard;
