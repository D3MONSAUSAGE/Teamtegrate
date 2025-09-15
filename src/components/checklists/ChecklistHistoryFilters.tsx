import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Search, Filter, Calendar, Users } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { useTeamQueries } from '@/hooks/organization/team/useTeamQueries';

interface ChecklistHistoryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  selectedTeam: string;
  onTeamChange: (value: string) => void;
  limit: number;
  onLimitChange: (value: number) => void;
}

export const ChecklistHistoryFilters: React.FC<ChecklistHistoryFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateRange,
  onDateRangeChange,
  selectedTeam,
  onTeamChange,
  limit,
  onLimitChange,
}) => {
  const { teams } = useTeamQueries();

  return (
    <div className="space-y-4">
      {/* Search and Status */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search checklists, users, or verifiers..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="completed_verified">Completed & Verified</SelectItem>
            <SelectItem value="completed">Completed Only</SelectItem>
            <SelectItem value="verified">Verified Only</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
          </SelectContent>
        </Select>

        <Select value={limit.toString()} onValueChange={(value) => onLimitChange(parseInt(value))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25 items</SelectItem>
            <SelectItem value="50">50 items</SelectItem>
            <SelectItem value="100">100 items</SelectItem>
            <SelectItem value="200">200 items</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range and Team */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <DatePickerWithRange
            date={dateRange}
            onDateChange={onDateRangeChange}
            className="w-auto"
          />
        </div>

        <Select value={selectedTeam} onValueChange={onTeamChange}>
          <SelectTrigger className="w-48">
            <Users className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams?.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};