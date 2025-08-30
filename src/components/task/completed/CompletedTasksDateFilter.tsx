import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarDays, Filter } from 'lucide-react';

interface DateFilterOption {
  value: string;
  label: string;
  days?: number;
}

const DATE_FILTER_OPTIONS: DateFilterOption[] = [
  { value: 'today', label: 'Today', days: 0 },
  { value: 'yesterday', label: 'Yesterday', days: 1 },
  { value: 'last7days', label: 'Last 7 days', days: 7 },
  { value: 'last30days', label: 'Last 30 days', days: 30 },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'all', label: 'All time' }
];

interface CompletedTasksDateFilterProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  taskCount: number;
}

const CompletedTasksDateFilter: React.FC<CompletedTasksDateFilterProps> = ({
  selectedFilter,
  onFilterChange,
  taskCount
}) => {
  const selectedOption = DATE_FILTER_OPTIONS.find(opt => opt.value === selectedFilter);

  return (
    <div className="flex items-center justify-between p-4 border-b border-border/30 bg-gradient-to-r from-card/40 to-accent/5 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter by:</span>
        </div>
        
        <Select value={selectedFilter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-40 h-8 bg-background/60 border-border/50 text-xs">
            <SelectValue>
              {selectedOption?.label || 'Select period'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DATE_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-xs">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarDays className="h-3 w-3" />
        <span>{taskCount} completed task{taskCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};

export default CompletedTasksDateFilter;