import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { CalendarIcon, Download, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportFiltersProps {
  timeRange: string;
  dateRange?: DateRange;
  selectedTeamId?: string;
  selectedUserId?: string;
  onTimeRangeChange: (value: string) => void;
  onDateRangeChange: (value: DateRange | undefined) => void;
  onTeamChange?: (value: string) => void;
  onUserChange?: (value: string) => void;
  onExport?: () => void;
  onRefresh?: () => void;
  showTeamFilter?: boolean;
  showUserFilter?: boolean;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  timeRange,
  dateRange,
  selectedTeamId,
  selectedUserId,
  onTimeRangeChange,
  onDateRangeChange,
  onTeamChange,
  onUserChange,
  onExport,
  onRefresh,
  showTeamFilter = false,
  showUserFilter = false
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Period:</span>
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7 days">7 Days</SelectItem>
                <SelectItem value="30 days">30 Days</SelectItem>
                <SelectItem value="90 days">90 Days</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {timeRange === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-72 justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={onDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Team Filter */}
          {showTeamFilter && onTeamChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Team:</span>
              <Select value={selectedTeamId || "all"} onValueChange={onTeamChange}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {/* TODO: Add actual teams */}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* User Filter */}
          {showUserFilter && onUserChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">User:</span>
              <Select value={selectedUserId || "all"} onValueChange={onUserChange}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {/* TODO: Add actual users */}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};