import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

interface ActiveFiltersChipsProps {
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

const ActiveFiltersChips: React.FC<ActiveFiltersChipsProps> = ({ 
  filters, 
  onRemove, 
  onClearAll 
}) => {
  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4 p-4 bg-muted/50 rounded-lg">
      <span className="text-sm text-muted-foreground font-medium">Active Filters:</span>
      {filters.map((filter) => (
        <Badge 
          key={filter.key} 
          variant="secondary" 
          className="pl-2 pr-1 py-1 gap-1"
        >
          <span className="text-xs">
            {filter.label}: <span className="font-semibold">{filter.value}</span>
          </span>
          <button
            onClick={() => onRemove(filter.key)}
            className="ml-1 rounded-full hover:bg-background/80 p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.length > 1 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearAll}
          className="h-6 px-2 text-xs"
        >
          Clear All
        </Button>
      )}
    </div>
  );
};

export default ActiveFiltersChips;
