
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

  // --- UI IMPROVEMENT START ---
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg p-0">
          <DrawerHeader className="bg-gradient-to-r from-primary/30 to-accent/40 rounded-t-xl shadow px-6 py-4 space-y-2">
            <DrawerTitle className="flex items-center justify-between text-xl font-bold text-emerald-900 dark:text-emerald-200">
              {task.title}
              <Badge className={getStatusColor(task.status) + " ml-2 px-2 py-1"}>{task.status}</Badge>
            </DrawerTitle>
            <DrawerDescription className="text-base text-muted-foreground mt-2">{task.description}</DrawerDescription>
            <div className="flex gap-2 mt-2">
              <Badge className={getPriorityColor(task.priority)}>{task.priority} Priority</Badge>
              {isOverdue() && (
                <span className="flex items-center gap-1 text-xs font-semibold text-rose-500 bg-rose-50 rounded px-2 py-1">
                  <AlertCircle className="h-4 w-4" /> Overdue
                </span>
              )}
            </div>
          </DrawerHeader>
          <div className="p-6 pb-2">
            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">{formatDate(task.deadline)}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{formatTime(task.deadline)}</span>
              </div>
              {task.assignedToName && (
                <div className="col-span-2 flex items-center mt-1">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground pr-1">Assigned to:</span>
                  <span className="font-medium">{task.assignedToName}</span>
                </div>
              )}
            </div>
            <Separator className="my-4" />
            <div className="space-y-3">
              <div className="font-medium text-base flex items-center mb-1">
                <MessageCircle className="h-5 w-5 mr-2" />
                Comments
              </div>
              {task.comments && task.comments.length > 0 ? (
                <TaskCommentsList
                  taskComments={task.comments}
                  className="mt-2 max-h-52 overflow-y-auto bg-muted/40 rounded-md p-2"
                />
              ) : (
                <div className="text-sm text-muted-foreground mt-2">
                  No comments yet.
                </div>
              )}
              <TaskCommentForm taskId={task.id} />
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <button className="w-full bg-accent/70 py-2 rounded text-base font-medium hover:bg-accent transition">
                Close
              </button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
  // --- UI IMPROVEMENT END ---
};

export default TaskDetailDrawer;
