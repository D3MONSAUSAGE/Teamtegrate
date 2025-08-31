import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Calendar, Clock } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface TimeRangeSelectorProps {
  timeRange: string;
  dateRange?: DateRange;
  onTimeRangeChange: (range: string) => void;
  onDateRangeChange: (range?: DateRange) => void;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  timeRange,
  dateRange,
  onTimeRangeChange,
  onDateRangeChange
}) => {
  const timeRangeOptions = [
    { value: '7 days', label: 'This Week', description: 'Last 7 days' },
    { value: '30 days', label: 'This Month', description: 'Last 30 days' },
    { value: 'custom', label: 'Custom Range', description: 'Choose specific dates' }
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Time Range Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Period
            </label>
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range (if selected) */}
          {timeRange === 'custom' && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Custom Range
              </label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={onDateRangeChange}
                className="w-full"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};