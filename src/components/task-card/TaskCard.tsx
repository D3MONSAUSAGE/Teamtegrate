
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

  const isOverdue = isTaskOverdue();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -4 }}
        className="h-full"
      >
        <Card
          className={cn(
            "relative transition-all duration-300 cursor-pointer rounded-2xl overflow-hidden h-full min-h-[320px] flex flex-col group",
            "bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl",
            "border border-border/40 hover:border-border/60",
            "shadow-lg hover:shadow-2xl",
            getPriorityBackground(task.priority),
            isOverdue && "ring-2 ring-red-400/50 shadow-red-400/20"
          )}
          onClick={handleCardClick}
          tabIndex={0}
          aria-label={`Open details for ${task.title}`}
          role="button"
        >
          {/* Overdue indicator - more subtle */}
          {isOverdue && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-red-500" />
          )}

          {/* Actions button (three dots) */}
          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
          
          {/* Overdue Label - repositioned and styled better */}
          {isOverdue && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-4 left-4 z-20"
            >
              <span className="inline-flex items-center gap-1 bg-red-500/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full shadow-lg font-semibold tracking-wide border border-red-400/30">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                Overdue
              </span>
            </motion.div>
          )}

          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none rounded-2xl" />
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
