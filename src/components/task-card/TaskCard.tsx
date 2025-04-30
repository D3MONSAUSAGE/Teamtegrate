
import React from "react";
import { Card } from "@/components/ui/card";
import { Task } from "@/types";
import { cn } from "@/lib/utils";
import TaskDetailDrawer from "../task/TaskDetailDrawer";
import TaskCardActions from "./TaskCardActions";
import TaskCardContent from "./TaskCardContent";
import { useTaskCard } from "./useTaskCard";

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
  const {
    showDrawer,
    setShowDrawer,
    getPriorityBackground,
    isTaskOverdue,
    handleStatusChange,
    handleDeleteTask,
    commentCount,
  } = useTaskCard(task);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowDrawer(true);
    }
  };

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
        <TaskCardContent
          task={task}
          handleStatusChange={handleStatusChange}
          commentCount={commentCount}
          onShowComments={() => setShowDrawer(true)}
        />
        
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
