
import React from 'react';
import { Task, TaskStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import TaskCardMetadata from './TaskCardMetadata';
import TaskCardStatusChip from './TaskCardStatusChip';
import { MessageCircle } from 'lucide-react';

interface TaskCardContentProps {
  task: Task;
  handleStatusChange: (status: TaskStatus) => void;
  commentCount: number;
  onShowComments: () => void;
}

const TaskCardContent: React.FC<TaskCardContentProps> = ({
  task,
  handleStatusChange,
  commentCount,
  onShowComments
}) => {
  // Import useTaskCard to get the getAssignedToName function
  const { getAssignedToName } = require('./useTaskCard').useTaskCard(task);
  
  return (
    <div className="p-4 space-y-3">
      <div className="space-y-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold line-clamp-2 leading-tight">{task.title}</h3>
        </div>
        
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 items-center">
        <TaskCardStatusChip 
          status={task.status} 
          onStatusChange={handleStatusChange} 
        />
        
        {task.priority && (
          <Badge variant="outline" className="text-[10px] rounded-sm h-5 px-1.5 bg-background/80">
            {task.priority}
          </Badge>
        )}
        
        {commentCount > 0 && (
          <Badge 
            variant="outline" 
            className="text-[10px] rounded-sm h-5 px-1.5 bg-background/80 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onShowComments();
            }}
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            {commentCount}
          </Badge>
        )}
      </div>
      
      <TaskCardMetadata 
        deadline={task.deadline} 
        assignedToName={task.assignedToName} 
        getAssignedToName={getAssignedToName}
      />
    </div>
  );
};

export default TaskCardContent;
