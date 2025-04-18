import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { formatDistance } from 'date-fns';
import { Clock, TimerOff, Coffee, UtensilsCrossed } from 'lucide-react';
import DailyTimeReport from './DailyTimeReport';

const TimeTracking: React.FC = () => {
  const { currentEntry, clockIn, clockOut, getWeeklyTimeEntries } = useTimeTracking();
  const [notes, setNotes] = useState('');
  const [elapsedTime, setElapsedTime] = useState('');
  const [dailyEntries, setDailyEntries] = useState<any[]>([]);

  useEffect(() => {
    const fetchDailyEntries = async () => {
      const entries = await getWeeklyTimeEntries();
      const today = new Date().toISOString().split('T')[0];
      const todayEntries = entries.filter(entry => 
        entry.clock_in.startsWith(today)
      );
      setDailyEntries(todayEntries);
    };
    fetchDailyEntries();
  }, [currentEntry]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentEntry.isClocked && currentEntry.clock_in) {
      interval = setInterval(() => {
        setElapsedTime(formatDistance(new Date(currentEntry.clock_in!), new Date()));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentEntry]);

  const handleBreak = (breakType: string) => {
    clockOut(`${breakType} break started`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Time Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <Input 
              placeholder="Optional notes" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-grow"
            />
            {currentEntry.isClocked ? (
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                <Button 
                  variant="destructive" 
                  onClick={() => clockOut(notes)}
                  className="w-full md:w-auto"
                >
                  <TimerOff className="mr-2 h-4 w-4" /> Clock Out
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBreak('Lunch')}
                  className="w-full md:w-auto"
                >
                  <UtensilsCrossed className="mr-2 h-4 w-4" /> Lunch Break
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBreak('Coffee')}
                  className="w-full md:w-auto"
                >
                  <Coffee className="mr-2 h-4 w-4" /> Break
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => clockIn(notes)}
                className="w-full md:w-auto"
              >
                <Clock className="mr-2 h-4 w-4" /> Clock In
              </Button>
            )}
          </div>

          {currentEntry.isClocked && (
            <div className="bg-muted p-3 rounded-md">
              <p>Current Session: {elapsedTime} elapsed</p>
            </div>
          )}
        </CardContent>
      </Card>

      <DailyTimeReport entries={dailyEntries} />
    </div>
  );
};

export default TimeTracking;
