
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface ProjectTasksFiltersProps {
  searchQuery: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
}

const ProjectTasksFilters: React.FC<ProjectTasksFiltersProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortByChange
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={onSearchChange}
          className="pl-8"
        />
      </div>
      <Select value={sortBy} onValueChange={onSortByChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="deadline">Deadline (Nearest)</SelectItem>
          <SelectItem value="priority">Priority (Highest)</SelectItem>
          <SelectItem value="created">Recently Created</SelectItem>
          <SelectItem value="upcoming">Upcoming</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProjectTasksFilters;
