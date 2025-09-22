import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Clock, 
  Calendar, 
  FileEdit, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TimerReset,
  CalendarX,
  Plus
} from 'lucide-react';
import { TimeEntry } from '@/hooks/useEmployeeTimeTracking';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday } from 'date-fns';
import TimeEntryRow from './TimeEntryRow';
import { TimeEntryCorrectionRequestForm } from '@/components/time-entries/TimeEntryCorrectionRequestForm';
import { MissingDayTimeEntryForm } from './MissingDayTimeEntryForm';
import { useTimeEntryCorrectionRequests, CreateCorrectionRequest } from '@/hooks/useTimeEntryCorrectionRequests';

interface WeeklyTimeEntriesCardProps {
  entries: TimeEntry[];
  weekStart: Date;
  weekEnd: Date;
}

export const WeeklyTimeEntriesCard: React.FC<WeeklyTimeEntriesCardProps> = ({
  entries,
  weekStart,
  weekEnd,
}) => {
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [showMissingDayForm, setShowMissingDayForm] = useState(false);
  const [selectedMissingDate, setSelectedMissingDate] = useState<Date | null>(null);
  const { createCorrectionRequest, myRequests, isLoading } = useTimeEntryCorrectionRequests();

  // Separate completed and active entries
  const completedEntries = entries.filter(entry => entry.clock_out);
  const activeEntries = entries.filter(entry => !entry.clock_out);

  // Get existing correction requests for these entries
  const existingRequests = myRequests.filter(request => 
    request.status === 'pending' || request.status === 'manager_approved'
  );

  // Get weekly days (Monday-Sunday)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(weekStart, { weekStartsOn: 1 }), i));

  const handleEntrySelection = (entryId: string, selected: boolean) => {
    const newSelection = new Set(selectedEntries);
    if (selected) {
      newSelection.add(entryId);
    } else {
      newSelection.delete(entryId);
    }
    setSelectedEntries(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedEntries.size === completedEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(completedEntries.map(entry => entry.id)));
    }
  };

  const handleSubmitCorrections = async (data: CreateCorrectionRequest) => {
    try {
      await createCorrectionRequest(data);
      setSelectedEntries(new Set());
      setShowCorrectionForm(false);
    } catch (error) {
      console.error('Failed to submit correction request:', error);
    }
  };

  const getSelectedEntriesData = () => {
    return completedEntries
      .filter(entry => selectedEntries.has(entry.id))
      .map(entry => ({
        id: entry.id,
        clock_in: entry.clock_in,
        clock_out: entry.clock_out || '',
        notes: entry.notes || '',
        user_id: entry.user_id,
        duration_minutes: entry.duration_minutes
      }));
  };

  const getApprovalStatusBadge = (entry: TimeEntry) => {
    switch (entry.approval_status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Approved
        </Badge>;
      case 'rejected':
        return <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>;
      case 'pending':
      default:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
    }
  };

  const calculateTotalHours = () => {
    return completedEntries.reduce((total, entry) => {
      if (entry.duration_minutes) {
        return total + entry.duration_minutes;
      }
      return total;
    }, 0) / 60;
  };

  // Get entries for a specific day
  const getDayEntries = (date: Date) => {
    return completedEntries.filter(entry => 
      isSameDay(new Date(entry.clock_in), date)
    );
  };

  const handleMissingDayRequest = (date: Date) => {
    setSelectedMissingDate(date);
    setShowMissingDayForm(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TimerReset className="h-5 w-5" />
                Time Entries
              </CardTitle>
              <CardDescription>
                Your time entries for this week ({format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d, yyyy')})
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20">
                Total: {calculateTotalHours().toFixed(1)}h
              </div>
              {selectedEntries.size > 0 && (
                <Button
                  onClick={() => setShowCorrectionForm(true)}
                  disabled={isLoading}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FileEdit className="h-4 w-4" />
                  Request Corrections ({selectedEntries.size})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Select All Controls */}
          {completedEntries.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedEntries.size === completedEntries.length}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  Select All ({completedEntries.length} entries)
                </label>
              </div>
              {selectedEntries.size > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedEntries.size} selected
                </div>
              )}
            </div>
          )}

          {/* Monday-Sunday Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const dayEntries = getDayEntries(day);
              const isDayToday = isToday(day);
              const isPastDay = day <= new Date();

              return (
                <Card 
                  key={day.toISOString()} 
                  className={`min-h-[300px] transition-all duration-200 hover:shadow-md ${
                    isDayToday 
                      ? 'ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-md' 
                      : 'hover:shadow-elegant'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-sm font-semibold ${isDayToday ? 'text-primary' : ''}`}>
                        {format(day, 'EEE')}
                      </CardTitle>
                      {isDayToday && (
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      )}
                    </div>
                    <CardDescription className={`text-xs font-medium ${isDayToday ? 'text-primary/70' : ''}`}>
                      {format(day, 'MMM d')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* Active entries first */}
                    {activeEntries.filter(entry => 
                      format(new Date(entry.clock_in), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                    ).map(entry => (
                      <div key={entry.id} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <div className="text-xs font-medium text-green-700">
                            Active: {format(new Date(entry.clock_in), 'HH:mm')} - now
                          </div>
                          <div className="text-xs text-green-600">
                            ({Math.floor((Date.now() - new Date(entry.clock_in).getTime()) / 60000)}m)
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                          Active
                        </Badge>
                      </div>
                    ))}
                    
                    {/* Completed entries */}
                    {dayEntries.length > 0 ? (
                      <div className="space-y-2">
                        {dayEntries.map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0 hover:bg-accent/30 transition-colors">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedEntries.has(entry.id)}
                                onCheckedChange={(checked) => handleEntrySelection(entry.id, checked as boolean)}
                              />
                              <div className="text-xs font-medium">
                                {format(new Date(entry.clock_in), 'HH:mm')} - {format(new Date(entry.clock_out || ''), 'HH:mm')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ({entry.duration_minutes ? `${Math.round(entry.duration_minutes / 60 * 10) / 10}h` : ''})
                              </div>
                            </div>
                            {getApprovalStatusBadge(entry)}
                          </div>
                        ))}
                      </div>
                     ) : (
                       // Check if there are any entries (active or completed) for this day
                       activeEntries.filter(entry => 
                         format(new Date(entry.clock_in), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                       ).length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-8 text-center">
                           <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                             <Clock className="w-4 h-4 text-muted-foreground/60" />
                           </div>
                           <div className="text-xs text-muted-foreground/70 font-medium mb-3">
                             No time entries found
                           </div>
                           {isPastDay && (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleMissingDayRequest(day)}
                               className="text-xs flex items-center gap-1"
                             >
                               <Plus className="w-3 h-3" />
                               Request Entry
                             </Button>
                           )}
                         </div>
                       ) : null
                     )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pending Correction Requests */}
          {existingRequests.length > 0 && (
            <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                Pending Correction Requests
              </h4>
              <div className="text-sm text-muted-foreground">
                You have {existingRequests.length} correction request(s) pending review.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TimeEntryCorrectionRequestForm
        open={showCorrectionForm}
        onOpenChange={setShowCorrectionForm}
        selectedEntries={getSelectedEntriesData()}
        onSubmit={handleSubmitCorrections}
      />

      <MissingDayTimeEntryForm
        open={showMissingDayForm}
        onOpenChange={setShowMissingDayForm}
        selectedDate={selectedMissingDate || new Date()}
        onSubmit={handleSubmitCorrections}
      />
    </>
  );
};