
import React from "react";
import { Task } from "@/types";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { MessageCircle, User, Calendar, Clock, AlertCircle } from "lucide-react";
import TaskCommentForm from "@/components/TaskCommentForm";
import TaskCommentsList from "@/components/TaskCommentsList";
import { Separator } from "@/components/ui/separator";

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
      return format(formattedDate, "MMM d, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const formatTime = (date: Date | string) => {
    try {
      const formattedDate = new Date(date);
      return format(formattedDate, "h:mm a");
    } catch {
      return "Invalid time";
    }
  };

  // For description, always show full content, never truncate
  // Assigned to: show name, or a friendly fallback if not present
  const assignedTo = task.assignedToName
    ? task.assignedToName
    : (task.assignedToId
        ? "Unassigned"
        : "—");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle className="flex items-center justify-between">
              <span>{task.title}</span>
              <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
            </DrawerTitle>
            <div
              className="mt-2 text-sm text-muted-foreground whitespace-pre-line px-1 py-2 rounded bg-muted border"
              style={{
                wordBreak: "break-word",
                lineHeight: "1.7",
                maxHeight: "none",
              }}
            >
              {task.description || <em className="text-xs text-gray-400">No description provided.</em>}
            </div>
          </DrawerHeader>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">{formatDate(task.deadline)}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">{formatTime(task.deadline)}</span>
              </div>
              <div>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority} Priority
                </Badge>
              </div>
              {isOverdue() && (
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4 text-rose-500" />
                  <span className="text-sm text-rose-500 font-medium">Overdue</span>
                </div>
              )}
              {/* Always show a human friendly label, never the ID */}
              {(
                <div className="col-span-2 text-sm flex items-center mt-2">
                  <User className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-muted-foreground pr-1">Assigned to:</span>
                  <span className="font-medium">{assignedTo}</span>
                </div>
              )}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="font-medium text-sm flex items-center">
                <MessageCircle className="h-4 w-4 mr-2" />
                Comments
              </div>
              {task.comments && task.comments.length > 0 ? (
                <TaskCommentsList
                  taskComments={task.comments}
                  className="mt-2 max-h-40 overflow-y-auto"
                />
              ) : (
                <div className="text-sm text-muted-foreground mt-2">
                  No comments yet
                </div>
              )}
              <TaskCommentForm taskId={task.id} />
            </div>
          </div>
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

