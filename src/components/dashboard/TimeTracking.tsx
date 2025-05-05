
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, PlusCircle, CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import WeeklyTimeReport from './WeeklyTimeReport';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import TimeEntryDialog from './time/TimeEntryDialog';
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';

const TimeTracking = () => {
  const [showTimeEntryDialog, setShowTimeEntryDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(new Date());
  
  const { timeEntries, isLoading, refresh } = useTimeEntries();
  
  const handleAddTimeEntry = () => {
    setShowTimeEntryDialog(true);
  };
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowTimeEntryDialog(true);
  };
  
  const handlePrevWeek = () => {
    const prevWeek = new Date(currentWeekDate);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentWeekDate(prevWeek);
  };
  
  const handleNextWeek = () => {
    const nextWeek = new Date(currentWeekDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentWeekDate(nextWeek);
  };
  
  const handleCurrentWeek = () => {
    setCurrentWeekDate(new Date());
  };

  // Find ongoing entry if exists
  const ongoingEntry = timeEntries.find(entry => !entry.clock_out);
  const clockedInText = ongoingEntry ? `Clocked in at ${format(new Date(ongoingEntry.clock_in), 'h:mm a')}` : null;
  
  return (
    <>
      <Card className="shadow-md border-slate-200 dark:border-slate-700 overflow-hidden bg-card">
        <CardHeader className={cn(
          "flex flex-row items-center justify-between space-y-0 pb-2",
          ongoingEntry ? "bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/30" : "bg-muted/20"
        )}>
          <div className="flex items-center space-x-2">
            <div className={cn(
              "p-2 rounded-full",
              ongoingEntry ? "bg-blue-100 dark:bg-blue-800/40" : "bg-primary/10"
            )}>
              <Clock className={cn(
                "h-5 w-5", 
                ongoingEntry ? "text-blue-600 dark:text-blue-400" : "text-primary"
              )} />
            </div>
            <div>
              <CardTitle className="text-xl">Time Tracking</CardTitle>
              {clockedInText && (
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                  {clockedInText}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="hidden lg:flex gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrevWeek}
                className="border-slate-200 dark:border-slate-700 hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button 
                variant="outline"
                size="sm" 
                onClick={handleCurrentWeek}
                className="border-slate-200 dark:border-slate-700 hover:bg-muted transition-colors"
              >
                <CalendarRange className="h-3.5 w-3.5 mr-1" />
                Current Week
              </Button>
              <Button 
                variant="outline"
                size="sm" 
                onClick={handleNextWeek}
                className="border-slate-200 dark:border-slate-700 hover:bg-muted transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <Button 
              size="sm" 
              onClick={handleAddTimeEntry} 
              className="bg-primary hover:bg-primary/90 gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Add Time</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="flex justify-between mb-4 md:hidden">
            <Button 
              variant="outline"
              size="sm" 
              onClick={handlePrevWeek} 
              className="border-slate-200 dark:border-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              size="sm" 
              onClick={handleCurrentWeek} 
              className="border-slate-200 dark:border-slate-700"
            >
              <CalendarRange className="h-3.5 w-3.5 mr-1" />
              Today
            </Button>
            <Button 
              variant="outline"
              size="sm" 
              onClick={handleNextWeek} 
              className="border-slate-200 dark:border-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <Skeleton className="h-10 w-full" />
              <div className="grid gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <WeeklyTimeReport 
              entries={timeEntries}
              weekDate={currentWeekDate}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          )}
        </CardContent>
      </Card>
      
      <TimeEntryDialog 
        open={showTimeEntryDialog} 
        onOpenChange={setShowTimeEntryDialog}
        selectedDate={selectedDate}
        onSuccess={refresh}
      />
    </>
  );
};

export default TimeTracking;
