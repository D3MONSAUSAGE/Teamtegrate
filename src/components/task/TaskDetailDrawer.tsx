
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Task } from '@/types';
import TaskDetailHeader from './TaskDetailHeader';
import TaskDetailMeta from './TaskDetailMeta';
import TaskDetailComments from './TaskDetailComments';
import { useTaskPermissions } from '@/hooks/useTaskPermissions';
import { Badge } from '@/components/ui/badge';
import { getAccessReasonText } from '@/utils/taskPermissions';

interface TaskDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

// Utility functions for task details
const getStatusColor = (status: string) => {
  switch(status) {
    case 'To Do': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
    case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

const getPriorityColor = (priority: string) => {
  switch(priority) {
    case 'Low': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
    case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
    case 'High': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
};

const formatTime = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString();
};

const isOverdue = (deadline: Date | string) => {
  const d = typeof deadline === 'string' ? new Date(deadline) : deadline;
  return d < new Date();
};

const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  open,
  onOpenChange,
  task
}) => {
  const permissions = task ? useTaskPermissions(task) : null;

  if (!task || !permissions?.canView) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4 pb-6 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold text-primary">
              Task Details
            </SheetTitle>
            {permissions.accessReason !== 'creator' && permissions.accessReason !== 'assigned' && (
              <Badge variant="secondary">
                {getAccessReasonText(permissions.accessReason)}
              </Badge>
            )}
          </div>
        </SheetHeader>
        
        <div className="space-y-8 py-6">
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
            assignedTo={task.assignedToName || 'Unassigned'}
            isOverdue={() => isOverdue(task.deadline)}
            getPriorityColor={getPriorityColor}
            formatDate={formatDate}
            formatTime={formatTime}
          />
          
          {permissions.canComment && (
            <TaskDetailComments 
              taskId={task.id}
              comments={task.comments}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetailDrawer;
