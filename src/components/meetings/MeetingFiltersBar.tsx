import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { ScrollableTabs, ScrollableTabsList, ScrollableTabsTrigger } from '@/components/ui/ScrollableTabs';
import { 
  Search, 
  SortAsc, 
  SortDesc, 
  Filter,
  X,
  Calendar,
  Clock,
  User,
  Clock3,
  CheckCircle
} from 'lucide-react';
import { MeetingFilters } from '@/hooks/useMeetingFilters';

interface MeetingFiltersBarProps {
  filters: MeetingFilters;
  counts: {
    all: number;
    upcoming: number;
    past: number;
    pending: number;
    myMeetings: number;
    needsResponse?: number;
    fullyConfirmed?: number;
  };
  onFiltersChange: (filters: Partial<MeetingFilters>) => void;
  onResetFilters: () => void;
}

export const MeetingFiltersBar: React.FC<MeetingFiltersBarProps> = ({
  filters,
  counts,
  onFiltersChange,
  onResetFilters
}) => {
  const hasActiveFilters = filters.search !== '' || filters.status !== 'upcoming';

  return (
    <div className="space-y-4">
      {/* Search and Sort Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative w-full md:max-w-md md:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search meetings, participants, or content..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="pl-10 min-h-[44px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={filters.sortBy} onValueChange={(value: any) => onFiltersChange({ sortBy: value })}>
            <SelectTrigger className="w-[140px] min-h-[44px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="participants">Participants</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onFiltersChange({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
            className="min-h-[44px]"
          >
            {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onResetFilters} className="min-h-[44px]">
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={filters.status} onValueChange={(value: any) => onFiltersChange({ status: value })}>
        <ScrollableTabs>
          <ScrollableTabsList className="md:grid md:grid-cols-7">
          <ScrollableTabsTrigger 
            isActive={filters.status === 'all'}
            onClick={() => onFiltersChange({ status: 'all' })}
          >
            <Calendar className="h-4 w-4" />
            All
            {counts.all > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-2">
                {counts.all}
              </Badge>
            )}
          </ScrollableTabsTrigger>
          
          <ScrollableTabsTrigger 
            isActive={filters.status === 'upcoming'}
            onClick={() => onFiltersChange({ status: 'upcoming' })}
          >
            <Clock className="h-4 w-4" />
            Upcoming
            {counts.upcoming > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-2">
                {counts.upcoming}
              </Badge>
            )}
          </ScrollableTabsTrigger>
          
          <ScrollableTabsTrigger 
            isActive={filters.status === 'needsResponse'}
            onClick={() => onFiltersChange({ status: 'needsResponse' })}
          >
            <Clock3 className="h-4 w-4" />
            Needs Response
            {(counts.needsResponse || 0) > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-2">
                {counts.needsResponse}
              </Badge>
            )}
          </ScrollableTabsTrigger>
          
          <ScrollableTabsTrigger 
            isActive={filters.status === 'fullyConfirmed'}
            onClick={() => onFiltersChange({ status: 'fullyConfirmed' })}
          >
            <CheckCircle className="h-4 w-4" />
            Confirmed
            {(counts.fullyConfirmed || 0) > 0 && (
              <Badge className="ml-1 h-5 px-2 bg-success text-success-foreground">
                {counts.fullyConfirmed}
              </Badge>
            )}
          </ScrollableTabsTrigger>
          
          <ScrollableTabsTrigger 
            isActive={filters.status === 'pending'}
            onClick={() => onFiltersChange({ status: 'pending' })}
          >
            <Clock3 className="h-4 w-4" />
            Pending
            {counts.pending > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-2">
                {counts.pending}
              </Badge>
            )}
          </ScrollableTabsTrigger>
          
          <ScrollableTabsTrigger 
            isActive={filters.status === 'my_meetings'}
            onClick={() => onFiltersChange({ status: 'my_meetings' })}
          >
            <User className="h-4 w-4" />
            My Meetings
            {counts.myMeetings > 0 && (
              <Badge variant="outline" className="ml-1 h-5 px-2">
                {counts.myMeetings}
              </Badge>
            )}
          </ScrollableTabsTrigger>
          
          <ScrollableTabsTrigger 
            isActive={filters.status === 'past'}
            onClick={() => onFiltersChange({ status: 'past' })}
          >
            <CheckCircle className="h-4 w-4" />
            Past
            {counts.past > 0 && (
              <Badge variant="outline" className="ml-1 h-5 px-2">
                {counts.past}
              </Badge>
            )}
          </ScrollableTabsTrigger>
        </ScrollableTabsList>
        </ScrollableTabs>
      </Tabs>
    </div>
  );
};