
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  Coffee, 
  UtensilsCrossed, 
  PlayCircle,
  StopCircle,
  Timer
} from 'lucide-react';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { format, isToday, differenceInMinutes } from 'date-fns';

interface TimeLogEntry {
  id: string;
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  time: Date;
  notes?: string;
  duration?: number;
}

const DailyTimeLog: React.FC = () => {
  const { timeEntries, currentEntry } = useTimeTracking();
  const [todaysEntries, setTodaysEntries] = useState<TimeLogEntry[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    // Filter today's entries and convert to log format
    const today = new Date();
    const todaysTimeEntries = timeEntries.filter(entry => 
      isToday(entry.clock_in)
    );

    const logEntries: TimeLogEntry[] = [];
    let totalWorkMinutes = 0;

    todaysTimeEntries.forEach(entry => {
      // Clock in entry
      logEntries.push({
        id: `${entry.id}-in`,
        type: 'clock_in',
        time: entry.clock_in,
        notes: entry.notes || undefined
      });

      // Clock out entry (if exists)
      if (entry.clock_out) {
        const duration = differenceInMinutes(entry.clock_out, entry.clock_in);
        const isBreak = entry.notes?.toLowerCase().includes('break') || 
                       entry.notes?.toLowerCase().includes('lunch') ||
                       entry.notes?.toLowerCase().includes('coffee');
        
        logEntries.push({
          id: `${entry.id}-out`,
          type: 'clock_out',
          time: entry.clock_out,
          notes: entry.notes || undefined,
          duration
        });

        if (!isBreak) {
          totalWorkMinutes += duration;
        }
      }
    });

    // Sort by time
    logEntries.sort((a, b) => a.time.getTime() - b.time.getTime());
    
    setTodaysEntries(logEntries);
    setTotalMinutes(totalWorkMinutes);
  }, [timeEntries]);

  const getEntryIcon = (type: string, notes?: string) => {
    switch (type) {
      case 'clock_in':
        return <PlayCircle className="h-4 w-4 text-green-600" />;
      case 'clock_out':
        if (notes?.toLowerCase().includes('coffee')) {
          return <Coffee className="h-4 w-4 text-orange-600" />;
        } else if (notes?.toLowerCase().includes('lunch')) {
          return <UtensilsCrossed className="h-4 w-4 text-blue-600" />;
        } else if (notes?.toLowerCase().includes('break')) {
          return <Timer className="h-4 w-4 text-purple-600" />;
        }
        return <StopCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEntryLabel = (type: string, notes?: string) => {
    switch (type) {
      case 'clock_in':
        return 'Clocked In';
      case 'clock_out':
        if (notes?.toLowerCase().includes('coffee')) {
          return 'Coffee Break';
        } else if (notes?.toLowerCase().includes('lunch')) {
          return 'Lunch Break';
        } else if (notes?.toLowerCase().includes('break')) {
          return 'Break Started';
        }
        return 'Clocked Out';
      default:
        return 'Unknown';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatTotalTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Today's Time Log
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-primary">
              {formatTotalTime(totalMinutes)}
            </div>
            <div className="text-xs text-muted-foreground">
              Total Work Time
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {todaysEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No time entries today</p>
            <p className="text-sm">Clock in to start tracking your time</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaysEntries.map((entry, index) => (
              <div key={entry.id}>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getEntryIcon(entry.type, entry.notes)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">
                          {getEntryLabel(entry.type, entry.notes)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(entry.time, 'h:mm a')}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {entry.duration && (
                          <Badge variant="secondary" className="text-xs">
                            {formatDuration(entry.duration)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {entry.notes && !entry.notes.toLowerCase().includes('break') && !entry.notes.toLowerCase().includes('lunch') && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {entry.notes}
                      </div>
                    )}
                  </div>
                </div>
                
                {index < todaysEntries.length - 1 && (
                  <Separator className="mt-3" />
                )}
              </div>
            ))}

            {/* Current Active Session */}
            {currentEntry?.isClocked && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-green-700 dark:text-green-300">
                      Current Session Active
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Started at {currentEntry.clock_in ? 
                        format(currentEntry.clock_in, 'h:mm a') : 
                        'Unknown'
                      }
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyTimeLog;
