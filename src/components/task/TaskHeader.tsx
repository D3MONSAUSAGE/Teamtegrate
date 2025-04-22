
import React from 'react';
import { Button } from "@/components/ui/button";
import { Filter, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Clock, ListOrdered } from 'lucide-react';

interface TaskHeaderProps {
  onNewTask: () => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

const TaskHeader = ({ onNewTask, sortBy, onSortChange }: TaskHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-2xl font-bold">My Tasks</h1>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" /> Sort by
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={sortBy} onValueChange={onSortChange}>
              <DropdownMenuRadioItem value="deadline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Deadline
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="upcoming" className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> Upcoming
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="priority" className="flex items-center gap-2">
                <ListOrdered className="h-4 w-4" /> Priority
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="created" className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> Newest First
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button onClick={onNewTask}>
          <Plus className="h-4 w-4 mr-2" /> New Task
        </Button>
      </div>
    </div>
  );
};

export default TaskHeader;
