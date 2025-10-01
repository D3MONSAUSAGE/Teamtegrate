import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Award, Clock } from "lucide-react";
import type { WeeklyChecklistSummary } from "@/services/checklistReportsService";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, parseISO } from "date-fns";

interface WeeklyChecklistReportProps {
  data: WeeklyChecklistSummary[];
  isLoading?: boolean;
  weekStart: string;
}

export function WeeklyChecklistReport({ data, isLoading, weekStart }: WeeklyChecklistReportProps) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Checklist Summary</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Checklist Summary</CardTitle>
          <CardDescription>Week of {format(parseISO(weekStart), 'MMM d, yyyy')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No checklist data available for this week
          </p>
        </CardContent>
      </Card>
    );
  }

  const totals = data.reduce(
    (acc, team) => ({
      total: acc.total + Number(team.total_checklists),
      completed: acc.completed + Number(team.approved_checklists),
      execution: acc.execution + Number(team.avg_execution_score),
      verification: acc.verification + Number(team.avg_verification_score),
      onTime: acc.onTime + Number(team.on_time_rate),
    }),
    { total: 0, completed: 0, execution: 0, verification: 0, onTime: 0 }
  );

  const avgExecution = data.length > 0 ? totals.execution / data.length : 0;
  const avgVerification = data.length > 0 ? totals.verification / data.length : 0;
  const avgOnTime = data.length > 0 ? totals.onTime / data.length : 0;

  if (isMobile) {
    return (
      <div className="space-y-3">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Execution</p>
              </div>
              <p className="text-2xl font-bold">{avgExecution.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-secondary" />
                <p className="text-xs text-muted-foreground">On-Time</p>
              </div>
              <p className="text-2xl font-bold">{avgOnTime.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Team Cards */}
        <div className="space-y-3">
          {data.map((team, idx) => {
            const chartData = team.daily_breakdown?.map((day: any) => ({
              date: format(parseISO(day.date), 'EEE'),
              score: Number(day.execution_score),
            })) || [];

            return (
              <Card key={idx} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{team.team_name || 'No Team'}</CardTitle>
                    <Badge variant={Number(team.completion_rate) >= 80 ? "default" : "secondary"}>
                      Rank #{idx + 1}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-semibold">{team.total_checklists}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="text-lg font-semibold text-green-600">{team.approved_checklists}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="text-lg font-semibold text-orange-600">{team.pending_checklists}</p>
                    </div>
                  </div>

                  {chartData.length > 0 && (
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--primary))" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Execution Score</span>
                      <span className="font-semibold">{Number(team.avg_execution_score).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Verification Score</span>
                      <span className="font-semibold">{Number(team.avg_verification_score).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">On-Time Rate</span>
                      <span className="font-semibold">{Number(team.on_time_rate).toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Checklist Summary</CardTitle>
        <CardDescription>Week of {format(parseISO(weekStart), 'MMM d, yyyy')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Checklists</p>
              <p className="text-2xl font-bold">{totals.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg Execution</p>
              <p className="text-2xl font-bold">{avgExecution.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg Verification</p>
              <p className="text-2xl font-bold">{avgVerification.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">On-Time Rate</p>
              <p className="text-2xl font-bold">{avgOnTime.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {data.map((team, idx) => {
            const chartData = team.daily_breakdown?.map((day: any) => ({
              date: format(parseISO(day.date), 'EEE'),
              score: Number(day.execution_score),
              completed: day.completed,
            })) || [];

            return (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{team.team_name || 'No Team'}</CardTitle>
                      <CardDescription>
                        {team.approved_checklists} of {team.total_checklists} completed
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge variant={Number(team.completion_rate) >= 80 ? "default" : "secondary"} className="mb-1">
                        {Number(team.completion_rate).toFixed(1)}% Complete
                      </Badge>
                      <p className="text-xs text-muted-foreground">Rank #{idx + 1}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      {chartData.length > 0 && (
                        <ResponsiveContainer width="100%" height={150}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Line 
                              type="monotone" 
                              dataKey="score" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Execution Score</span>
                        <span className="text-sm font-semibold">{Number(team.avg_execution_score).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Verification Score</span>
                        <span className="text-sm font-semibold">{Number(team.avg_verification_score).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">On-Time Rate</span>
                        <span className="text-sm font-semibold">{Number(team.on_time_rate).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Pending</span>
                        <Badge variant="outline">{team.pending_checklists}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
