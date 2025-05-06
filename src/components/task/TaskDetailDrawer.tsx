
import React from "react";
import { Task } from "@/types";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import TaskDetailHeader from "./TaskDetailHeader";
import TaskDetailMeta from "./TaskDetailMeta";
import TaskDetailComments from "./TaskDetailComments";
import { useTaskDetailHelpers } from "./hooks/useTaskDetailHelpers";

interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  open,
  onOpenChange,
}) => {
  if (!task) return null;
  
  const {
    getStatusColor,
    getPriorityColor,
    isOverdue,
    formatDate,
    formatTime,
    getAssignedToName
  } = useTaskDetailHelpers(task);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <TaskDetailHeader
            title={task.title}
            status={task.status}
            description={task.description}
            getStatusColor={getStatusColor}
          />
          <TaskDetailMeta
            deadline={task.deadline}
            status={task.status}
            priority={task.priority}
            assignedTo={getAssignedToName()}
            assignedToId={task.assignedToId}
            isOverdue={isOverdue}
            getPriorityColor={getPriorityColor}
            formatDate={formatDate}
            formatTime={formatTime}
          />
          <TaskDetailComments
            taskId={task.id}
            comments={task.comments}
          />
          <DrawerFooter>
            <DrawerClose asChild>
              <button className="w-full bg-gray-100 py-2 rounded text-sm font-medium">
                Close
              </button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default TaskDetailDrawer;
