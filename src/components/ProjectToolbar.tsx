
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
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
      <h1 className="text-2xl font-bold">Projects</h1>
      <div className="flex flex-col md:flex-row items-center w-full md:w-auto gap-2">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" /> Sort by
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
        
        <Button onClick={onCreateProject}>
          <Plus className="h-4 w-4 mr-2" /> New Project
        </Button>
      </div>
    </div>
  );
};

export default ProjectToolbar;
