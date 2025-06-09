
import React from 'react';
import { Button } from "@/components/ui/button";
import { Filter, Plus, Sparkles, Zap } from 'lucide-react';
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
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent">
              My Tasks
            </h1>
            <div className="absolute -top-1 -right-1">
              <Zap className="h-6 w-6 md:h-8 md:w-8 text-primary animate-pulse" />
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-lg md:text-xl font-medium">
          Organize and conquer your work with style
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="lg" 
              className="gap-3 h-12 px-6 bg-background/60 backdrop-blur-sm border-border/60 hover:bg-background/80 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Filter className="h-4 w-4" /> 
              <span className="font-medium">Sort by</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-border/60">
            <DropdownMenuRadioGroup value={sortBy} onValueChange={onSortChange}>
              <DropdownMenuRadioItem value="deadline" className="flex items-center gap-3 py-3">
                <Calendar className="h-4 w-4" /> Deadline
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="upcoming" className="flex items-center gap-3 py-3">
                <Clock className="h-4 w-4" /> Upcoming
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="priority" className="flex items-center gap-3 py-3">
                <ListOrdered className="h-4 w-4" /> Priority
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="created" className="flex items-center gap-3 py-3">
                <Clock className="h-4 w-4" /> Newest First
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          onClick={onNewTask}
          size="lg"
          className="h-12 px-8 bg-gradient-to-r from-primary via-primary to-purple-600 hover:from-purple-600 hover:via-primary hover:to-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
        >
          <Plus className="h-5 w-5 mr-2" /> 
          New Task
        </Button>
      </div>
    </div>
  );
};

export default TaskHeader;
