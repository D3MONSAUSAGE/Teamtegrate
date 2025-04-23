
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Plus, Filter, Search, SortAsc, X, Calendar, Tag, CheckSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ProjectToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onCreateProject: () => void;
}

const ProjectToolbar: React.FC<ProjectToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  onCreateProject,
}) => {
  const isMobile = useIsMobile();
  
  const getSortLabel = () => {
    switch (sortBy) {
      case 'date': return 'Creation Date';
      case 'start': return 'Start Date';
      case 'end': return 'End Date';
      case 'title': return 'Title';
      case 'progress': return 'Progress';
      default: return 'Sort';
    }
  };
  
  return (
    <div className="flex flex-col gap-3 mb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold">Projects</h1>
        <Button onClick={onCreateProject} size={isMobile ? "sm" : "default"} className="gap-2">
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="relative w-full sm:w-64 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size={isMobile ? "sm" : "default"} 
                className={cn(
                  "gap-2",
                  sortBy !== 'date' && "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400"
                )}
              >
                <SortAsc className="h-4 w-4" /> {getSortLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Sort Projects</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                <DropdownMenuRadioItem value="date" className="gap-2">
                  <Calendar className="h-4 w-4" /> Creation Date
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="start" className="gap-2">
                  <Calendar className="h-4 w-4" /> Start Date
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="end" className="gap-2">
                  <Calendar className="h-4 w-4" /> End Date
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="title" className="gap-2">
                  <Tag className="h-4 w-4" /> Title
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="progress" className="gap-2">
                  <CheckSquare className="h-4 w-4" /> Progress
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default ProjectToolbar;
