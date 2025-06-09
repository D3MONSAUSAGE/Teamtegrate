
import React from "react";
import { Card } from "@/components/ui/card";
import { Task, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";
import TaskDetailDrawer from "../task/TaskDetailDrawer";
import TaskCardActions from "./TaskCardActions";
import TaskCardContent from "./TaskCardContent";
import { useTaskCard } from "./useTaskCard";
import { motion } from "framer-motion";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onAssign?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onAssign,
  onStatusChange,
  onClick,
}) => {
  const {
    showDrawer,
    setShowDrawer,
    getPriorityBackground,
    isTaskOverdue,
    handleStatusChange: internalHandleStatusChange,
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

  // Use the external status change handler if provided, otherwise use the internal one
  const handleStatusChange = (status: TaskStatus) => {
    if (onStatusChange) {
      onStatusChange(task.id, status);
    } else {
      internalHandleStatusChange(status);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.02 }}
        className="h-full"
      >
        <Card
          className={cn(
            "relative transition-all duration-300 cursor-pointer rounded-xl overflow-hidden shadow-sm hover:shadow-md ring-1 ring-border h-full min-h-[280px] flex flex-col",
            getPriorityBackground(task.priority),
            isTaskOverdue() && "outline outline-2 outline-red-400 dark:outline-red-500",
          )}
          onClick={handleCardClick}
          tabIndex={0}
          aria-label={`Open details for ${task.title}`}
          role="button"
        >
          {/* Actions button (three dots) */}
          <div className="absolute top-3 right-3 z-10">
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
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-3 left-1/2 -translate-x-1/2 z-20"
            >
              <span className="inline-block bg-red-500/90 text-white text-xs px-3 py-1 rounded-full shadow font-semibold tracking-wide">
                Overdue
              </span>
            </motion.div>
          )}
        </Card>
      </motion.div>
      <TaskDetailDrawer
        open={showDrawer}
        onOpenChange={setShowDrawer}
        task={task}
      />
    </>
  );
};

export default TaskCard;
