
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "To Do":
        return "bg-slate-200 text-slate-700";
      case "In Progress":
        return "bg-blue-200 text-blue-800";
      case "Pending":
        return "bg-amber-200 text-amber-700";
      case "Completed":
        return "bg-green-200 text-green-700";
      default:
        return "";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Low":
        return "bg-blue-100 text-blue-800";
      case "Medium":
        return "bg-amber-100 text-amber-800";
      case "High":
        return "bg-rose-100 text-rose-800";
      default:
        return "";
    }
  };

  const isOverdue = () => {
    try {
      const now = new Date();
      const deadline = new Date(task.deadline);
      return task.status !== "Completed" && deadline < now;
    } catch (error) {
      return false;
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      const formattedDate = new Date(date);
      return formatDateFns(formattedDate, "MMM d, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const formatTime = (date: Date | string) => {
    try {
      const formattedDate = new Date(date);
      return formatDateFns(formattedDate, "h:mm a");
    } catch {
      return "Invalid time";
    }
  };

  // Use date-fns for formatting
  import { format as formatDateFns } from "date-fns";

  // Handle assigned to name
  const getAssignedToName = () => {
    if (!task.assignedToName || task.assignedToName.trim() === "") {
      return "Unassigned";
    }
    if (task.assignedToId && (!task.assignedToName || task.assignedToName === task.assignedToId)) {
      return "Unassigned";
    }
    return task.assignedToName;
  };

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
