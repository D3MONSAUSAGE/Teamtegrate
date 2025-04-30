
import React from 'react';
import { List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, Filter, Clock } from 'lucide-react';

interface ProjectTasksFiltersProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sortBy: string;
  onSortByChange: (sortType: string) => void;
}

const ProjectTasksFilters: React.FC<ProjectTasksFiltersProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortByChange,
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="relative flex-1 max-w-sm">
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={onSearchChange}
          className="pl-9"
        />
        <List className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onSortByChange('deadline')}
        >
          <Calendar className={`h-4 w-4 ${sortBy === 'deadline' ? 'text-primary' : ''} mr-1`} />
          By Date
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onSortByChange('priority')}
        >
          <Filter className={`h-4 w-4 ${sortBy === 'priority' ? 'text-primary' : ''} mr-1`} />
          Priority
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onSortByChange('created')}
        >
          <Clock className={`h-4 w-4 ${sortBy === 'created' ? 'text-primary' : ''} mr-1`} />
          Recent
        </Button>
      </div>
    </div>
  );
};

export default ProjectTasksFilters;
