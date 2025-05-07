
import React from 'react';
import { TaskStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

interface TaskCardStatusChipProps {
  status: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
}

const TaskCardStatusChip: React.FC<TaskCardStatusChipProps> = ({
  status,
  onStatusChange,
}) => {
  const getStatusColor = (status: TaskStatus) => {
    switch(status) {
      case 'To Do': return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200';
      case 'Completed': return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge 
          variant="outline"
          className={cn(
            "text-[10px] rounded-sm h-5 px-2 flex items-center gap-1 cursor-pointer",
            getStatusColor(status)
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {status}
          <ChevronDownIcon className="h-3 w-3" />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32">
        {['To Do', 'In Progress', 'Pending', 'Completed'].map((statusOption) => (
          <DropdownMenuItem
            key={statusOption}
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(statusOption as TaskStatus);
            }}
            className="text-xs flex items-center justify-between"
          >
            {statusOption}
            {status === statusOption && <CheckIcon className="h-3 w-3" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TaskCardStatusChip;
