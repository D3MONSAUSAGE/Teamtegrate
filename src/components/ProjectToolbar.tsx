
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Plus, Filter, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from '@/hooks/use-mobile';

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
  
  return (
    <div className="flex flex-col gap-3 mb-4 md:mb-8">
      <h1 className="text-xl md:text-2xl font-bold">Projects</h1>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size={isMobile ? "sm" : "default"} className="gap-2">
                <Filter className="h-4 w-4" /> Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                <DropdownMenuRadioItem value="date">Creation Date</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="start">Start Date</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="end">End Date</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="title">Title</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={onCreateProject} size={isMobile ? "sm" : "default"} className="ml-auto sm:ml-0">
            <Plus className="h-4 w-4 mr-2" /> New Project
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectToolbar;
