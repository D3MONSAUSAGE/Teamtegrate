
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
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent animate-gradient">
              My Tasks
            </h1>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-xl font-medium max-w-2xl leading-relaxed">
          Organize, prioritize, and conquer your goals with style and efficiency
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="lg" 
              className="gap-3 h-14 px-6 rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card hover:border-primary/30 hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Filter className="h-5 w-5" /> 
              <span className="font-semibold">Sort by</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-2 border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
            <DropdownMenuRadioGroup value={sortBy} onValueChange={onSortChange}>
              <DropdownMenuRadioItem value="deadline" className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-primary/10 transition-colors">
                <Calendar className="h-4 w-4 text-primary" /> 
                <span className="font-medium">Deadline</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="upcoming" className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-primary/10 transition-colors">
                <Clock className="h-4 w-4 text-primary" /> 
                <span className="font-medium">Upcoming</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="priority" className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-primary/10 transition-colors">
                <ListOrdered className="h-4 w-4 text-primary" /> 
                <span className="font-medium">Priority</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="created" className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-primary/10 transition-colors">
                <Zap className="h-4 w-4 text-primary" /> 
                <span className="font-medium">Newest First</span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          onClick={onNewTask}
          size="lg"
          className="h-14 px-8 rounded-2xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-primary/20"
        >
          <Plus className="h-5 w-5 mr-3" /> 
          Create Task
        </Button>
      </div>
    </div>
  );
};

export default TaskHeader;
