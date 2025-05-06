
import React from 'react';
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Tag } from "lucide-react";
import { ProjectStatus } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProjectsFiltersProps {
  searchQuery: string;
  statusFilter: ProjectStatus | 'All';
  tagFilter: string | 'All';
  allTags: string[];
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ProjectStatus | 'All') => void;
  onTagFilterChange: (value: string) => void;
}

const ProjectsFilters: React.FC<ProjectsFiltersProps> = ({
  searchQuery,
  statusFilter,
  tagFilter,
  allTags,
  onSearchChange,
  onStatusFilterChange,
  onTagFilterChange
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            {statusFilter === 'All' ? 'All Statuses' : statusFilter}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as ProjectStatus | 'All')}>
            <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="To Do">To Do</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="In Progress">In Progress</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="Completed">Completed</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {allTags.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex gap-2">
              <Tag className="h-4 w-4" />
              {tagFilter === 'All' ? 'All Tags' : tagFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 max-h-80 overflow-auto">
            <DropdownMenuLabel>Filter by Tag</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={tagFilter} onValueChange={onTagFilterChange}>
              <DropdownMenuRadioItem value="All">All Tags</DropdownMenuRadioItem>
              {allTags.map((tag) => (
                <DropdownMenuRadioItem key={tag} value={tag}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-5 flex items-center">
                      <Tag className="h-3 w-3 mr-1" /> {tag}
                    </Badge>
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default ProjectsFilters;
