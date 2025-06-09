
import React from 'react';
import { Button } from "@/components/ui/button";
import { Filter, Plus, Zap } from 'lucide-react';
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
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            My Tasks
          </h1>
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <p className="text-muted-foreground text-lg">
          Organize and manage your work effectively
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="lg" 
              className="gap-2 h-11 px-4"
            >
              <Filter className="h-4 w-4" /> 
              Sort by
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
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
        
        <Button 
          onClick={onNewTask}
          size="lg"
          className="h-11 px-6"
        >
          <Plus className="h-4 w-4 mr-2" /> 
          New Task
        </Button>
      </div>
    </div>
  );
};

export default TaskHeader;
