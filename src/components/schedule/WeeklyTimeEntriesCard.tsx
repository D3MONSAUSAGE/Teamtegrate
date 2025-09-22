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
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
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

  // Filter out active sessions (entries without clock_out)
  const completedEntries = entries.filter(entry => entry.clock_out);

  // Get existing correction requests for these entries
  const existingRequests = myRequests.filter(request => 
    request.status === 'pending' || request.status === 'manager_approved'
  );

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

  // Get missing days (days with no time entries)
  const getMissingDays = () => {
    const weekDates = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(weekStart), i));
    return weekDates.filter(date => {
      const hasEntry = completedEntries.some(entry => 
        isSameDay(new Date(entry.clock_in), date)
      );
      return !hasEntry && date <= new Date(); // Only show past/current days as missing
    });
  };

  const missingDays = getMissingDays();

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
                Your time entries for {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
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
          {completedEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <div className="text-lg font-medium text-muted-foreground/70">
                No completed time entries
              </div>
              <div className="text-sm text-muted-foreground/50 mt-1">
                Your time entries will appear here once you clock out
              </div>
            </div>
          ) : (
            <>
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

              <div className="space-y-2">
                {completedEntries.map((entry) => (
                  <TimeEntryRow
                    key={entry.id}
                    entry={entry}
                    isSelected={selectedEntries.has(entry.id)}
                    onSelectionChange={(selected) => handleEntrySelection(entry.id, selected)}
                    approvalStatusBadge={getApprovalStatusBadge(entry)}
                    existingRequests={existingRequests}
                  />
                ))}
              </div>

              {/* Missing Days Section */}
              {missingDays.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium mb-3 flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                    <CalendarX className="w-4 h-4" />
                    Missing Time Entries
                  </h4>
                  <div className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                    The following days have no time entries. You can request to add them:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {missingDays.map((date) => (
                      <Button
                        key={date.toISOString()}
                        variant="outline"
                        size="sm"
                        onClick={() => handleMissingDayRequest(date)}
                        className="justify-between bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                      >
                        <span>{format(date, 'EEE, MMM d')}</span>
                        <Plus className="w-3 h-3" />
                      </Button>
                    ))}
                  </div>
                </div>
              )}

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
            </>
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