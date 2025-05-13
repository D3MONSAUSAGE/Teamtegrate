
import React from "react";
import TaskCardHeader from "./TaskCardHeader";
import TaskCardDescription from "./TaskCardDescription";
import TaskCardMetadata from "./TaskCardMetadata";
import TaskCardFooter from "./TaskCardFooter";
import { Task, TaskStatus } from "@/types";
import { CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface TaskCardContentProps {
  task: Task;
  handleStatusChange: (newStatus: TaskStatus) => void;
  commentCount: number;
  onShowComments: () => void;
}

const TaskCardContent: React.FC<TaskCardContentProps> = ({
  task,
  handleStatusChange,
  commentCount,
  onShowComments,
}) => {
  return (
    <motion.div 
      className="pt-6 px-4 md:px-6 pb-2 flex flex-col gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <TaskCardHeader title={task.title} priority={task.priority} />
      <CardContent className="space-y-2 p-0">
        <TaskCardDescription description={task.description} />
        <TaskCardMetadata
          deadline={task.deadline}
          assignedToName={task.assignedToName}
        />
        <TaskCardFooter
          status={task.status}
          isOverdue={new Date(task.deadline) < new Date()}
          commentCount={commentCount}
          onShowComments={onShowComments}
          onStatusChange={handleStatusChange}
        />
      </CardContent>
    </motion.div>
  );
};

export default TaskCardContent;
