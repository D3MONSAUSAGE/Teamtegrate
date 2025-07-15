
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from "date-fns";
import { cn } from '@/lib/utils';

interface TaskScheduleSectionProps {
  scheduledStartDate: Date | undefined;
  scheduledEndDate: Date | undefined;
  scheduledStartTime: string;
  scheduledEndTime: string;
  onScheduledStartDateChange: (date: Date | undefined) => void;
  onScheduledEndDateChange: (date: Date | undefined) => void;
  onScheduledStartTimeChange: (time: string) => void;
  onScheduledEndTimeChange: (time: string) => void;
}

const TaskScheduleSection: React.FC<TaskScheduleSectionProps> = ({
  scheduledStartDate,
  scheduledEndDate,
  scheduledStartTime,
  scheduledEndTime,
  onScheduledStartDateChange,
  onScheduledEndDateChange,
  onScheduledStartTimeChange,
  onScheduledEndTimeChange
}) => {
  return (
    <Card className="border-2 border-primary/10 shadow-lg">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Clock className="h-5 w-5" />
          Schedule Time Frame (Optional)
        </div>

        {/* Scheduled Start Section */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Scheduled Start
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !scheduledStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledStartDate ? format(scheduledStartDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledStartDate}
                    onSelect={onScheduledStartDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={scheduledStartTime}
                onChange={(e) => onScheduledStartTimeChange(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Scheduled End Section */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Scheduled End
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !scheduledEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledEndDate ? format(scheduledEndDate, "PPP") : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledEndDate}
                    onSelect={onScheduledEndDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={scheduledEndTime}
                onChange={(e) => onScheduledEndTimeChange(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Clear Schedule Button */}
        {(scheduledStartDate || scheduledEndDate) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onScheduledStartDateChange(undefined);
              onScheduledEndDateChange(undefined);
              onScheduledStartTimeChange('');
              onScheduledEndTimeChange('');
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear Schedule
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskScheduleSection;
