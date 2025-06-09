
import React from 'react';
import { Button } from "@/components/ui/button";
import { Filter, Plus, Sparkles } from 'lucide-react';
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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            My Tasks
          </h1>
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <p className="text-muted-foreground text-lg">
          Organize and track your work efficiently
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="default" 
              className="gap-2 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80 transition-all duration-200"
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
          className="interactive-button bg-gradient-to-r from-primary to-emerald-500 hover:from-emerald-600 hover:to-lime-500 shadow-lg px-6"
        >
          <Plus className="h-4 w-4 mr-2" /> 
          New Task
        </Button>
      </div>
    </div>
  );
};

export default TaskHeader;
