
import React from 'react';
import { Task } from '@/types';
import { useTask } from '@/contexts/task';
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import TaskDetailHeader from './task-detail/TaskDetailHeader';
import TaskDetailMeta from './task-detail/TaskDetailMeta';
import TaskDetailComments from './task-detail/TaskDetailComments';
import TaskDetailFooter from './task-detail/TaskDetailFooter';
import { useTaskDetailUtils } from './task-detail/useTaskDetailUtils';

interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  open,
  onOpenChange
}) => {
  const { updateTaskStatus } = useTask();

  if (!task) return null;
  
  const {
    getStatusColor,
    getPriorityColor,
    isOverdue,
    formatDate,
    formatTime
  } = useTaskDetailUtils(task);

  const handleStatusChange = (status: 'To Do' | 'In Progress' | 'Done') => {
    updateTaskStatus(task.id, status);
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
          
          <div className="p-4">
            <TaskDetailMeta
              deadline={task.deadline}
              priority={task.priority}
              assignedToName={task.assignedToName}
              isOverdue={isOverdue}
              formatDate={formatDate}
              formatTime={formatTime}
              getPriorityColor={getPriorityColor}
            />
            
            <TaskDetailComments
              taskId={task.id}
              comments={task.comments}
            />
          </div>
          
          <TaskDetailFooter
            status={task.status}
            onStatusChange={handleStatusChange}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default TaskDetailDrawer;
