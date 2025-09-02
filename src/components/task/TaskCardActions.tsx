
import React from 'react';
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Task, TaskStatus } from '@/types';

interface TaskCardActionsProps {
  onEdit?: (task: Task) => void;
  onAssign?: (task: Task) => void;
  onStatusChange: (status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onShowComments: () => void;
  task: Task;
}

const TaskCardActions: React.FC<TaskCardActionsProps> = ({
  onEdit,
  onAssign,
  onStatusChange,
  onDelete,
  onShowComments,
  task,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => e.stopPropagation()}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="text-xs md:text-sm">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit && onEdit(task); }}>
          Edit
        </DropdownMenuItem>
        {onAssign && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAssign(task); }}>
            Assign Member
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShowComments(); }}>
          View Comments
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-red-500" 
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TaskCardActions;
