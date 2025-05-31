
import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProjectTasksFiltersProps {
  searchQuery: string;
  sortBy: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSortByChange: (value: string) => void;
}

const ProjectTasksFilters: React.FC<ProjectTasksFiltersProps> = ({
  searchQuery,
  sortBy,
  onSearchChange,
  onSortByChange
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="sm:w-64">
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={onSearchChange}
        />
      </div>
      <div>
        <Select 
          value={sortBy} 
          onValueChange={onSortByChange}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deadline">Deadline</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="created">Recently Created</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProjectTasksFilters;
