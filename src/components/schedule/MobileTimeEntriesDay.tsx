import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Clock, Plus, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { TimeEntry } from '@/hooks/useEmployeeTimeTracking';

interface MobileTimeEntriesDayProps {
  day: Date;
  entries: TimeEntry[];
  activeEntries: TimeEntry[];
  selectedEntries: Set<string>;
  onEntrySelection: (entryId: string, selected: boolean) => void;
  onRequestEntry: (date: Date) => void;
  isPastDay: boolean;
}

export const MobileTimeEntriesDay: React.FC<MobileTimeEntriesDayProps> = ({
  day,
  entries,
  activeEntries,
  selectedEntries,
  onEntrySelection,
  onRequestEntry,
  isPastDay,
}) => {
  const isDayToday = isToday(day);
  
  const getApprovalStatusBadge = (entry: TimeEntry) => {
    switch (entry.approval_status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };
  
  return (
    <Card 
      className={`min-h-[280px] transition-all duration-200 ${
        isDayToday 
          ? 'ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-md' 
          : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-base font-semibold ${isDayToday ? 'text-primary' : ''}`}>
            {format(day, 'EEEE')}
          </CardTitle>
          {isDayToday && (
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          )}
        </div>
        <CardDescription className={`text-sm font-medium ${isDayToday ? 'text-primary/70' : ''}`}>
          {format(day, 'MMMM d, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Active entries */}
        {activeEntries.map(entry => (
          <div key={entry.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <div className="text-sm font-medium text-green-700 dark:text-green-300">
                Active: {format(new Date(entry.clock_in), 'HH:mm')} - now
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                ({Math.floor((Date.now() - new Date(entry.clock_in).getTime()) / 60000)}m)
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300">
              Active
            </Badge>
          </div>
        ))}
        
        {/* Completed entries */}
        {entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 py-3 border-b border-border/30 last:border-b-0 hover:bg-accent/30 transition-colors rounded px-2">
                <Checkbox
                  checked={selectedEntries.has(entry.id)}
                  onCheckedChange={(checked) => onEntrySelection(entry.id, checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {format(new Date(entry.clock_in), 'HH:mm')} - {format(new Date(entry.clock_out || ''), 'HH:mm')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {entry.duration_minutes ? `${Math.round(entry.duration_minutes / 60 * 10) / 10}h` : ''}
                    </div>
                  </div>
                  {getApprovalStatusBadge(entry)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          activeEntries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <div className="text-sm text-muted-foreground/70 font-medium mb-3">
                No time entries
              </div>
              {isPastDay && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRequestEntry(day)}
                  className="text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Request Entry
                </Button>
              )}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};
