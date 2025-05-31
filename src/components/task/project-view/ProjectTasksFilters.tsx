
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from 'lucide-react';

interface ProjectTasksFiltersProps {
  searchQuery: string;
  sortBy: string;
  onSearchChange: (query: string) => void;
  onSortByChange: (sortBy: string) => void;
}

const ProjectTasksFilters: React.FC<ProjectTasksFiltersProps> = ({
  searchQuery,
  sortBy,
  onSearchChange,
  onSortByChange
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={sortBy} onValueChange={onSortByChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="deadline">Sort by Deadline</SelectItem>
          <SelectItem value="priority">Sort by Priority</SelectItem>
          <SelectItem value="created">Sort by Created Date</SelectItem>
          <SelectItem value="upcoming">Sort by Upcoming</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProjectTasksFilters;
