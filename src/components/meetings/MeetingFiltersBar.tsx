import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search meetings, participants, or content..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="pl-10"
          />
        </div>

        <Select value={filters.sortBy} onValueChange={(value: any) => onFiltersChange({ sortBy: value })}>
          <SelectTrigger className="w-[140px]">
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
        >
          {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
        </Button>

        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={onResetFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={filters.status} onValueChange={(value: any) => onFiltersChange({ status: value })}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            All
            {counts.all > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-2">
                {counts.all}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Upcoming
            {counts.upcoming > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-2">
                {counts.upcoming}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock3 className="h-4 w-4" />
            Pending
            {counts.pending > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-2">
                {counts.pending}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="my_meetings" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My Meetings
            {counts.myMeetings > 0 && (
              <Badge variant="outline" className="ml-1 h-5 px-2">
                {counts.myMeetings}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="past" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Past
            {counts.past > 0 && (
              <Badge variant="outline" className="ml-1 h-5 px-2">
                {counts.past}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};