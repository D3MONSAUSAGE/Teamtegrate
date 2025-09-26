import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, RefreshCw } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
}

interface ReportsControlsProps {
  teams: Team[];
  selectedTeam?: string;
  onTeamChange: (teamId?: string) => void;
  timeRange: 'daily' | 'weekly' | 'monthly';
  onTimeRangeChange: (range: 'daily' | 'weekly' | 'monthly') => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onRefresh: () => void;
  onExport: () => void;
  isLoading?: boolean;
}

export const ReportsControls: React.FC<ReportsControlsProps> = ({
  teams,
  selectedTeam,
  onTeamChange,
  timeRange,
  onTimeRangeChange,
  selectedDate,
  onDateChange,
  onRefresh,
  onExport,
  isLoading = false
}) => {
  const getDateRangeDisplay = () => {
    switch (timeRange) {
      case 'daily':
        return format(selectedDate, 'PPP');
      case 'weekly':
        const weekStart = startOfWeek(selectedDate);
        const weekEnd = endOfWeek(selectedDate);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'monthly':
        return format(selectedDate, 'MMMM yyyy');
      default:
        return format(selectedDate, 'PPP');
    }
  };

  const getQuickDateOptions = () => {
    const today = new Date();
    
    switch (timeRange) {
      case 'daily':
        return [
          { label: 'Today', date: today },
          { label: 'Yesterday', date: subDays(today, 1) },
          { label: '7 days ago', date: subDays(today, 7) },
          { label: '30 days ago', date: subDays(today, 30) }
        ];
      case 'weekly':
        return [
          { label: 'This Week', date: today },
          { label: 'Last Week', date: subDays(today, 7) },
          { label: '2 Weeks Ago', date: subDays(today, 14) },
          { label: 'Month Ago', date: subDays(today, 30) }
        ];
      case 'monthly':
        return [
          { label: 'This Month', date: today },
          { label: 'Last Month', date: new Date(today.getFullYear(), today.getMonth() - 1, 1) },
          { label: '2 Months Ago', date: new Date(today.getFullYear(), today.getMonth() - 2, 1) },
          { label: '3 Months Ago', date: new Date(today.getFullYear(), today.getMonth() - 3, 1) }
        ];
      default:
        return [];
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-end">
          {/* Team Selector */}
          <div className="flex-1 min-w-0">
            <label className="text-sm font-medium mb-2 block">Team</label>
            <Select value={selectedTeam || 'all'} onValueChange={(value) => onTeamChange(value === 'all' ? undefined : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select team..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Range Selector */}
          <div className="flex-1 min-w-0">
            <label className="text-sm font-medium mb-2 block">Time Range</label>
            <Select value={timeRange} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => onTimeRangeChange(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily View</SelectItem>
                <SelectItem value="weekly">Weekly View</SelectItem>
                <SelectItem value="monthly">Monthly View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker */}
          <div className="flex-1 min-w-0">
            <label className="text-sm font-medium mb-2 block">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {getDateRangeDisplay()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b">
                  <div className="grid grid-cols-2 gap-2">
                    {getQuickDateOptions().map((option) => (
                      <Button
                        key={option.label}
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => onDateChange(option.date)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && onDateChange(date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={onExport}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};