import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Calendar, Users, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { ReportFilter } from '@/types/reports';

interface FilterBadgesProps {
  filter: ReportFilter;
  onClearFilter?: (filterType: 'date' | 'team' | 'user') => void;
}

export const FilterBadges: React.FC<FilterBadgesProps> = ({ filter, onClearFilter }) => {
  const hasFilters = filter.userId || (filter.teamIds && filter.teamIds.length > 0) || filter.dateISO;

  if (!hasFilters) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      
      {filter.dateISO && (
        <Badge variant="secondary" className="gap-1 pl-2 pr-1">
          <Calendar className="h-3 w-3" />
          <span className="text-xs">
            {filter.view === 'weekly' && filter.weekStartISO
              ? `Week of ${format(parseISO(filter.weekStartISO), 'MMM d')}`
              : format(parseISO(filter.dateISO), 'MMM d, yyyy')}
          </span>
          {onClearFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => onClearFilter('date')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </Badge>
      )}

      {filter.teamIds && filter.teamIds.length > 0 && (
        <Badge variant="secondary" className="gap-1 pl-2 pr-1">
          <Users className="h-3 w-3" />
          <span className="text-xs">
            {filter.teamIds.length === 1 ? 'Team selected' : `${filter.teamIds.length} teams`}
          </span>
          {onClearFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => onClearFilter('team')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </Badge>
      )}

      {filter.userId && (
        <Badge variant="secondary" className="gap-1 pl-2 pr-1">
          <User className="h-3 w-3" />
          <span className="text-xs">User selected</span>
          {onClearFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => onClearFilter('user')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </Badge>
      )}
    </div>
  );
};