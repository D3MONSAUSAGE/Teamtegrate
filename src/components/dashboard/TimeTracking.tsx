import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { format, startOfWeek, addWeeks, subWeeks, addDays } from 'date-fns';
import { Clock, TimerOff, Coffee, UtensilsCrossed, FileExport, CalendarDays, Search } from 'lucide-react';
import DailyTimeReport from './DailyTimeReport';
import WeeklyTimeReport from './WeeklyTimeReport';

function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = addDays(start, 6);
  return { start, end };
}

function downloadCSV(entries: any[], weekStart: Date, weekEnd: Date) {
  if (!entries || !entries.length) return;
  const cols = ["Day", "Clock In", "Clock Out", "Duration (mins)", "Notes"];
  let csv = cols.join(",") + "\n";
  entries.forEach((entry) => {
    const day = format(new Date(entry.clock_in), "yyyy-MM-dd (EEEE)");
    const clockIn = format(new Date(entry.clock_in), "HH:mm");
    const clockOut = entry.clock_out ? format(new Date(entry.clock_out), "HH:mm") : "";
    const duration = entry.duration_minutes ?? "";
    const notes = entry.notes ? `"${(entry.notes + "").replace(/"/g, '""')}"` : "";
    csv += [day, clockIn, clockOut, duration, notes].join(",") + "\n";
  });
  const fileName = `Weekly_Time_Report_${format(weekStart, "yyyyMMdd")}_${format(weekEnd, "yyyyMMdd")}.csv`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
}

const TimeTracking: React.FC = () => {
  const { currentEntry, clockIn, clockOut, getWeeklyTimeEntries } = useTimeTracking();
  const [notes, setNotes] = useState('');
  const [elapsedTime, setElapsedTime] = useState('');
  const [dailyEntries, setDailyEntries] = useState<any[]>([]);
  const [weeklyEntries, setWeeklyEntries] = useState<any[]>([]);
  const [weekDate, setWeekDate] = useState<Date>(new Date());
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { start: weekStart, end: weekEnd } = getWeekRange(weekDate);

  useEffect(() => {
    const fetchEntries = async () => {
      const entries = await getWeeklyTimeEntries(weekStart);
      const today = new Date().toISOString().split('T')[0];
      const todayEntries = entries.filter(entry => entry.clock_in.startsWith(today));
      setDailyEntries(todayEntries);
      setWeeklyEntries(entries);
    };
    fetchEntries();
  }, [currentEntry, weekStart.getTime()]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentEntry.isClocked && currentEntry.clock_in) {
      interval = setInterval(() => {
        setElapsedTime(
          require("date-fns/formatDistance")(
            new Date(currentEntry.clock_in!), new Date()
          )
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentEntry]);

  const handleBreak = (breakType: string) => {
    clockOut(`${breakType} break started`);
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    setWeekDate(
      direction === "prev" ? subWeeks(weekDate, 1) : addWeeks(weekDate, 1)
    );
  };

  const handleSearch = () => {
    setIsSearching(true);
    let date: Date | null = null;
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(searchValue)) {
        date = new Date(searchValue);
      } else if (/^\d{4}-\d{2}$/.test(searchValue)) {
        date = new Date(searchValue + "-01");
      } else {
        throw new Error("Invalid date format");
      }
      setWeekDate(date);
    } catch {
      // Ignore and do nothing if invalid
    }
    setIsSearching(false);
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

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleWeekChange("prev")}
            title="Previous week"
          >
            <CalendarDays className="h-4 w-4" />
            <span className="sr-only">Previous Week</span>
          </Button>
          <span className="font-medium">
            {format(weekStart, "MMM dd, yyyy")} - {format(weekEnd, "MMM dd, yyyy")}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleWeekChange("next")}
            title="Next week"
          >
            <CalendarDays className="h-4 w-4 rotate-180" />
            <span className="sr-only">Next Week</span>
          </Button>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Input
            placeholder="Search week (yyyy-MM or yyyy-MM-dd)"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            className="max-w-[170px]"
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            disabled={isSearching}
          />
          <Button
            onClick={handleSearch}
            variant="outline"
            disabled={isSearching}
            title="Go"
            size="icon"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => downloadCSV(weeklyEntries, weekStart, weekEnd)}
            variant="secondary"
            title="Export CSV"
          >
            <FileExport className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <DailyTimeReport entries={dailyEntries} />
      <WeeklyTimeReport entries={weeklyEntries} />
    </div>
  );
};

export default TimeTracking;
