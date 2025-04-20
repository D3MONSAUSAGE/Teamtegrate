
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TasksHeaderProps {
  onNewTask: () => void;
  sortBy: "deadline" | "priority" | "created";
  setSortBy: React.Dispatch<React.SetStateAction<"deadline" | "priority" | "created">>;
}

const TasksHeader: React.FC<TasksHeaderProps> = ({ onNewTask, sortBy, setSortBy }) => (
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
          <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
            <DropdownMenuRadioItem value="deadline">Deadline</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="priority">Priority</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="created">Creation Date</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button onClick={onNewTask}>
        <Plus className="h-4 w-4 mr-2" /> New Task
      </Button>
    </div>
  </div>
);

export default TasksHeader;
