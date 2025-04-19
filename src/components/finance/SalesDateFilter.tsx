
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { cn } from '@/lib/utils';
import { CalendarIcon } from "lucide-react";

interface SalesDateFilterProps {
  dateRange: 'week' | 'month' | 'custom';
  onDateRangeChange: (range: 'week' | 'month' | 'custom') => void;
  startDate: Date;
  endDate: Date;
  onCustomDateChange: (start: Date, end: Date) => void;
}

const SalesDateFilter: React.FC<SalesDateFilterProps> = ({
  dateRange,
  onDateRangeChange,
  startDate,
  endDate,
  onCustomDateChange
}) => {
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date>(endDate);
  
  const handleRangeChange = (newRange: 'week' | 'month' | 'custom') => {
    onDateRangeChange(newRange);
    
    if (newRange === 'custom') {
      setIsCustomRangeOpen(true);
    }
  };
  
  const handleApplyCustomRange = () => {
    if (tempStartDate && tempEndDate) {
      onCustomDateChange(tempStartDate, tempEndDate);
      setIsCustomRangeOpen(false);
    }
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={dateRange === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRangeChange('week')}
            >
              This Week
            </Button>
            <Button
              variant={dateRange === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRangeChange('month')}
            >
              This Month
            </Button>
            <Button
              variant={dateRange === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRangeChange('custom')}
            >
              Custom Range
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">Date Range: </span>
              <span className="text-gray-600">
                {format(startDate, "MMM dd, yyyy")} - {format(endDate, "MMM dd, yyyy")}
              </span>
            </div>
            
            {dateRange === 'custom' && (
              <Popover open={isCustomRangeOpen} onOpenChange={setIsCustomRangeOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-auto">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Select Dates
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="end">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Start Date</h4>
                      <Calendar
                        mode="single"
                        selected={tempStartDate}
                        onSelect={(date) => date && setTempStartDate(date)}
                        disabled={(date) => date > tempEndDate}
                        className={cn("rounded-md border", "pointer-events-auto")}
                      />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">End Date</h4>
                      <Calendar
                        mode="single"
                        selected={tempEndDate}
                        onSelect={(date) => date && setTempEndDate(date)}
                        disabled={(date) => date < tempStartDate}
                        className={cn("rounded-md border", "pointer-events-auto")}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleApplyCustomRange}>
                        Apply Range
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesDateFilter;
