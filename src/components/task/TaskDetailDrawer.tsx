
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
          <TaskDetailHeader task={task} />
          <TaskDetailMeta task={task} />
          
          {permissions.canComment && (
            <TaskDetailComments task={task} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetailDrawer;
