
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
import { useIsMobile } from '@/hooks/use-mobile';

interface TaskHeaderProps {
  onNewTask: () => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

const TaskHeader = ({ onNewTask, sortBy, onSortChange }: TaskHeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col space-y-6 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
              My Tasks
            </h1>
            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-pulse" />
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-base sm:text-lg lg:text-xl font-medium max-w-2xl leading-relaxed">
          Organize, prioritize, and conquer your goals with style and efficiency
        </p>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size={isMobile ? "default" : "lg"} 
              className={`gap-2 sm:gap-3 ${isMobile ? 'h-11 px-4' : 'h-14 px-6'} rounded-xl sm:rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card hover:border-primary/30 hover:shadow-lg hover:scale-105 transition-all duration-300`}
            >
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" /> 
              <span className="font-semibold">Sort</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 sm:w-56 rounded-xl border-2 border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
            <DropdownMenuRadioGroup value={sortBy} onValueChange={onSortChange}>
              <DropdownMenuRadioItem value="deadline" className="flex items-center gap-3 py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-primary/10 transition-colors">
                <Calendar className="h-4 w-4 text-primary" /> 
                <span className="font-medium">Deadline</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="upcoming" className="flex items-center gap-3 py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-primary/10 transition-colors">
                <Clock className="h-4 w-4 text-primary" /> 
                <span className="font-medium">Upcoming</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="priority" className="flex items-center gap-3 py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-primary/10 transition-colors">
                <ListOrdered className="h-4 w-4 text-primary" /> 
                <span className="font-medium">Priority</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="created" className="flex items-center gap-3 py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-primary/10 transition-colors">
                <Zap className="h-4 w-4 text-primary" /> 
                <span className="font-medium">Newest First</span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          onClick={onNewTask}
          size={isMobile ? "default" : "lg"}
          className={`${isMobile ? 'h-11 px-4' : 'h-14 px-8'} rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-primary/20 mobile-touch-target`}
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" /> 
          {isMobile ? 'Create' : 'Create Task'}
        </Button>
      </div>
    </div>
  );
};

export default TaskHeader;
