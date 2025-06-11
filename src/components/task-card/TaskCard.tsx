
import React from 'react';
import { Card } from '@/components/ui/card';
import { Task, TaskStatus } from '@/types';
import TaskCardHeader from './TaskCardHeader';
import TaskCardContent from './TaskCardContent';
import TaskCardFooter from './TaskCardFooter';
import { useTaskPermissions } from '@/hooks/useTaskPermissions';
import { Badge } from '@/components/ui/badge';
import { getAccessReasonText } from '@/utils/taskPermissions';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  showProjectInfo?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onEdit, 
  onClick, 
  onStatusChange,
  showProjectInfo = false 
}) => {
  const permissions = useTaskPermissions(task);

  if (!permissions.canView) {
    return null; // Don't render tasks the user can't view
  }

  const handleEdit = () => {
    if (permissions.canEdit && onEdit) {
      onEdit(task);
    }
  };

  const handleStatusChange = (status: TaskStatus) => {
    if (permissions.canUpdateStatus && onStatusChange) {
      onStatusChange(task.id, status);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(task);
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 glass-card border-2 border-border/40 hover:border-primary/30 bg-gradient-to-br from-card/95 via-card/90 to-card/85 backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10 p-6 space-y-4">
        <TaskCardHeader 
          title={task.title}
          priority={task.priority}
          onEdit={permissions.canEdit ? handleEdit : undefined}
        />
        
        <TaskCardContent 
          task={task}
          handleStatusChange={handleStatusChange}
          commentCount={task.comments?.length || 0}
          onShowComments={handleClick}
        />
        
        {/* Access reason badge */}
        {permissions.accessReason !== 'creator' && permissions.accessReason !== 'assigned' && (
          <div className="flex justify-start">
            <Badge variant="secondary" className="text-xs">
              {getAccessReasonText(permissions.accessReason)}
            </Badge>
          </div>
        )}
        
        <TaskCardFooter 
          task={task} 
          onStatusChange={permissions.canUpdateStatus ? handleStatusChange : undefined}
          showProjectInfo={showProjectInfo}
        />
      </div>
    </Card>
  );
};

export default TaskCard;
