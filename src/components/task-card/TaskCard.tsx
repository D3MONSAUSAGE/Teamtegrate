
import React from "react";
import { Card } from "@/components/ui/card";
import { Task } from "@/types";
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
            "relative transition-all duration-300 cursor-pointer rounded-xl overflow-hidden shadow-sm hover:shadow-md ring-1 ring-border h-full",
            getPriorityBackground(task.priority),
            isTaskOverdue() && "outline outline-2 outline-red-400 dark:outline-red-500",
          )}
          onClick={handleCardClick}
          tabIndex={0}
          aria-label={`Open details for ${task.title}`}
          role="button"
        >
          {/* Overdue Label - Moved to the top of card with proper spacing */}
          {isTaskOverdue() && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-0 left-0 w-full bg-red-500/90 text-white text-xs text-center py-1 font-semibold tracking-wide z-20"
            >
              Overdue
            </motion.div>
          )}
          
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

          {/* Main Content - Add padding-top when overdue to avoid overlap */}
          <div className={cn(isTaskOverdue() ? "pt-6" : "")}>
            <TaskCardContent
              task={task}
              handleStatusChange={handleStatusChange}
              commentCount={commentCount}
              onShowComments={() => setShowDrawer(true)}
            />
          </div>
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
