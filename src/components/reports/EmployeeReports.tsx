import React from 'react';
import { DateRange } from 'react-day-picker';
import { useEmployeeReports } from '@/hooks/useEmployeeReports';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface EmployeeReportsProps {
  timeRange: string;
  dateRange?: DateRange;
  selectedMembers: string[];
}

const Stat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="rounded-lg border bg-card text-card-foreground p-4">
    <div className="text-sm text-muted-foreground">{label}</div>
    <div className="text-2xl font-semibold mt-1">{value}</div>
  </div>
);

const EmployeeReports: React.FC<EmployeeReportsProps> = ({ timeRange, dateRange, selectedMembers }) => {
  const { user } = useAuth();
  const targetUserId = selectedMembers?.[0] ?? (user?.id || '');

  const { taskStats, hoursStats, contributions, isLoading, error } = useEmployeeReports({
    userId: targetUserId,
    timeRange,
    dateRange,
  });

  if (!targetUserId) {
    return <div className="text-muted-foreground">Select a team member to view employee reports.</div>;
  }

  if (isLoading) {
    return <div className="text-muted-foreground">Loading employee analytics...</div>;
  }

  if (error) {
    return <div className="text-destructive">Failed to load employee analytics.</div>;
  }

  const contribData = (contributions || []).map((c: any) => ({
    name: c.project_title ?? 'No Project',
    tasks: Number(c.task_count ?? 0),
    completed: Number(c.completed_count ?? 0),
  }));

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Tasks" value={taskStats?.total ?? 0} />
        <Stat label="Completed" value={taskStats?.completed ?? 0} />
        <Stat label="In Progress" value={taskStats?.in_progress ?? 0} />
        <Stat label="Overdue" value={taskStats?.overdue ?? 0} />
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Total Minutes" value={hoursStats?.total_minutes ?? 0} />
        <Stat label="Sessions" value={hoursStats?.session_count ?? 0} />
        <Stat label="Overtime (min)" value={hoursStats?.overtime_minutes ?? 0} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Project Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          {contribData.length === 0 ? (
            <div className="text-muted-foreground">No project contributions found for the selected period.</div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contribData}>
                  <XAxis dataKey="name" hide={false} interval={0} angle={-20} height={60} textAnchor="end" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tasks" stackId="a" fill="hsl(var(--primary))" />
                  <Bar dataKey="completed" stackId="a" fill="hsl(var(--primary) / 0.5)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeReports;
