
import React from 'react';
import { Task, TaskStatus } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical, 
  Pencil, 
  UserPlus, 
  CheckCircle2, 
  PlayCircle, 
  PauseCircle,
  Trash2,
  MessageCircle
} from 'lucide-react';

interface TaskCardActionsProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onAssign?: (task: Task) => void;
  onStatusChange?: (status: TaskStatus) => void;
  onDelete?: (taskId: string) => void;
  onShowComments?: () => void;
}

const TaskCardActions: React.FC<TaskCardActionsProps> = ({ 
  task, 
  onEdit, 
  onAssign, 
  onStatusChange,
  onDelete,
  onShowComments
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        
        {onAssign && (
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            onAssign(task);
          }}>
            <UserPlus className="mr-2 h-4 w-4" />
            Assign
          </DropdownMenuItem>
        )}
        
        {onShowComments && (
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            onShowComments();
          }}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Comments
          </DropdownMenuItem>
        )}
        
        {onStatusChange && (
          <>
            {task.status !== 'Completed' && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onStatusChange('Completed');
              }}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                Mark Complete
              </DropdownMenuItem>
            )}
            
            {task.status !== 'In Progress' && task.status !== 'Completed' && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onStatusChange('In Progress');
              }}>
                <PlayCircle className="mr-2 h-4 w-4 text-blue-600" />
                Start Progress
              </DropdownMenuItem>
            )}
            
            {task.status === 'In Progress' && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onStatusChange('Pending');
              }}>
                <PauseCircle className="mr-2 h-4 w-4 text-amber-600" />
                Pause Progress
              </DropdownMenuItem>
            )}
          </>
        )}
        
        {onDelete && (
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TaskCardActions;
