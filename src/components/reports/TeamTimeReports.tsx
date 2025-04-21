
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { startOfWeek, addDays, endOfWeek, format, differenceInMinutes } from "date-fns";
import useTeamMembers from "@/hooks/useTeamMembers";
import { supabase } from "@/integrations/supabase/client";
import { User, TeamMember } from "@/types";
import { CalendarDays, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TimeEntry = {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out?: string | null;
  duration_minutes?: number | null;
  notes?: string | null;
};

const getWeekRange = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
};

const formatHours = (mins: number) => (mins / 60).toFixed(2);

const TeamTimeReports: React.FC = () => {
  const { teamMembers } = useTeamMembers();
  const [weekDate, setWeekDate] = useState(new Date());
  const [teamEntries, setTeamEntries] = useState<Record<string, TimeEntry[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { start: weekStart, end: weekEnd } = getWeekRange(weekDate);

  // Fetch each team member's week entries
  useEffect(() => {
    const fetchTeamEntries = async () => {
      setIsLoading(true);
      const entriesByMember: Record<string, TimeEntry[]> = {};
      if (!teamMembers.length) {
        setIsLoading(false);
        return;
      }
      for (let i = 0; i < teamMembers.length; i++) {
        const member = teamMembers[i];
        const { data, error } = await supabase
          .from("time_entries")
          .select("*")
          .eq("user_id", member.id)
          .gte("clock_in", weekStart.toISOString())
          .lte("clock_in", weekEnd.toISOString())
          .order("clock_in", { ascending: true });
        entriesByMember[member.id] = data || [];
      }
      setTeamEntries(entriesByMember);
      setIsLoading(false);
    };
    fetchTeamEntries();
  }, [teamMembers, weekDate.getTime()]);

  // Change weeks
  const changeWeek = (delta: number) => {
    setWeekDate(prev => addDays(prev, delta * 7));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Users className="h-5 w-5 mr-2 text-muted-foreground" />
          <CardTitle>Team Members Time Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-2">
            <Button variant="outline" size="icon" onClick={() => changeWeek(-1)}>
              <CalendarDays className="h-4 w-4" />
              <span className="sr-only">Previous week</span>
            </Button>
            <span className="font-medium">
              {format(weekStart, "MMM dd, yyyy")} - {format(weekEnd, "MMM dd, yyyy")}
            </span>
            <Button variant="outline" size="icon" onClick={() => changeWeek(1)}>
              <CalendarDays className="h-4 w-4 rotate-180" />
              <span className="sr-only">Next week</span>
            </Button>
          </div>
          <div className="text-muted-foreground text-sm mb-4">
            View and analyze your team members' working hours for the selected week.
          </div>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading team reports...</div>
          ) : (
            <div className="space-y-6">
              {teamMembers.map((member) => {
                const entries = teamEntries[member.id] || [];
                // Calculate weekly total
                const totalMinutes = entries.reduce((acc, entry) => {
                  if (entry.duration_minutes) return acc + entry.duration_minutes;
                  if (entry.clock_in && entry.clock_out) {
                    return acc + differenceInMinutes(
                      new Date(entry.clock_out),
                      new Date(entry.clock_in)
                    );
                  }
                  return acc;
                }, 0);
                // Daily breakdown
                const days = Array.from({ length: 7 }, (_, d) => addDays(weekStart, d));
                return (
                  <Card key={member.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {member.name} ({member.email})
                        <span className="ml-auto text-xs text-muted-foreground">
                          Total Hours: <span className="font-semibold">{formatHours(totalMinutes)}</span>
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Day</TableHead>
                            <TableHead>Entries</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {days.map(day => {
                            const dateStr = day.toISOString().slice(0, 10);
                            const dayEntries = entries.filter(e => e.clock_in.startsWith(dateStr));
                            const dayMinutes = dayEntries.reduce((acc, entry) => {
                              if (entry.duration_minutes) return acc + entry.duration_minutes;
                              if (entry.clock_in && entry.clock_out) {
                                return acc + differenceInMinutes(
                                  new Date(entry.clock_out),
                                  new Date(entry.clock_in)
                                );
                              }
                              return acc;
                            }, 0);
                            return (
                              <TableRow key={dateStr}>
                                <TableCell>{format(day, 'EEE MMM dd')}</TableCell>
                                <TableCell>
                                  {dayEntries.length === 0 ? (
                                    <span className="text-muted-foreground text-xs">No entries</span>
                                  ) : dayEntries.map((e, i) => (
                                    <div key={e.id} className="text-xs text-muted-foreground">
                                      {format(new Date(e.clock_in), "HH:mm")} -{" "}
                                      {e.clock_out ? format(new Date(e.clock_out), "HH:mm") : "ongoing"}
                                      {e.notes && <span className="ml-1 italic">({e.notes})</span>}
                                    </div>
                                  ))}
                                </TableCell>
                                <TableCell>
                                  {dayMinutes ? formatHours(dayMinutes) + "h" : "-"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })}
              {teamMembers.length === 0 && (
                <div className="text-muted-foreground text-center">No team members found.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamTimeReports;
