
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, PlusCircle } from 'lucide-react';
import WeeklyTimeReport from './WeeklyTimeReport';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import TimeEntryDialog from './time/TimeEntryDialog';
import { startOfWeek, addDays, format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";

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
  
  return (
    <>
      <Card className="shadow-sm border-slate-200 dark:border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Time Tracking</CardTitle>
          </div>
          <div className="flex gap-2">
            <div className="hidden lg:flex gap-1">
              <Button variant="ghost" size="sm" onClick={handlePrevWeek}>
                Previous
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCurrentWeek}>
                Current Week
              </Button>
              <Button variant="ghost" size="sm" onClick={handleNextWeek}>
                Next
              </Button>
            </div>
            <Button size="sm" onClick={handleAddTimeEntry} className="gap-1">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Add Time</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4 md:hidden">
            <Button variant="ghost" size="sm" onClick={handlePrevWeek}>
              &larr;
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCurrentWeek}>
              Today
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNextWeek}>
              &rarr;
            </Button>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
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
