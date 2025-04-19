
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Task } from '@/types';
import { cn } from "@/lib/utils";
import TaskCommentsDialog from './TaskCommentsDialog';
import TaskCardHeader from './task/TaskCardHeader';
import TaskCardActions from './task/TaskCardActions';
import TaskCardDescription from './task/TaskCardDescription';
import TaskCardMetadata from './task/TaskCardMetadata';
import TaskCardFooter from './task/TaskCardFooter';
import { useTask } from '@/contexts/task';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onAssign?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onAssign }) => {
  const { updateTaskStatus, deleteTask } = useTask();
  const [showComments, setShowComments] = useState(false);
  
  const isTaskOverdue = () => {
    const now = new Date();
    return task.status !== 'Completed' && task.deadline < now;
  };
  
  const commentCount = task.comments?.length || 0;
  
  return (
    <>
      <Card className={cn("card-hover", isTaskOverdue() && "border-red-500")}>
        <TaskCardHeader 
          title={task.title} 
          priority={task.priority}
        />
        <CardContent className="space-y-2 pt-0 md:pt-1 px-4 md:px-6 pb-4">
          <TaskCardDescription description={task.description} />
          
          <TaskCardMetadata 
            deadline={task.deadline}
            assignedToName={task.assignedToName}
          />
          
          <TaskCardFooter 
            status={task.status}
            isOverdue={isTaskOverdue()}
            commentCount={commentCount}
            onShowComments={() => setShowComments(true)}
          />
        </CardContent>

        <div className="absolute top-1 right-1">
          <TaskCardActions 
            task={task}
            onEdit={onEdit}
            onAssign={onAssign}
            onStatusChange={(status) => updateTaskStatus(task.id, status)}
            onDelete={deleteTask}
            onShowComments={() => setShowComments(true)}
          />
        </div>
      </Card>
      
      <TaskCommentsDialog 
        open={showComments}
        onOpenChange={setShowComments}
        task={task}
      />
    </>
  );
};

export default TaskCard;
