import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import type { DailyChecklistScore } from "@/services/checklistReportsService";
import { useIsMobile } from "@/hooks/use-mobile";

interface DailyChecklistReportProps {
  data: DailyChecklistScore[];
  isLoading?: boolean;
  date: string;
}

export function DailyChecklistReport({ data, isLoading, date }: DailyChecklistReportProps) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Checklist Report</CardTitle>
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
          <CardTitle>Daily Checklist Report</CardTitle>
          <CardDescription>{new Date(date).toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No checklist data available for this date
          </p>
        </CardContent>
      </Card>
    );
  }

  const totals = data.reduce(
    (acc, row) => ({
      total: acc.total + Number(row.total_checklists),
      completed: acc.completed + Number(row.completed_checklists),
      pending: acc.pending + Number(row.pending_checklists),
      execution: acc.execution + Number(row.avg_execution_score),
      verification: acc.verification + Number(row.avg_verification_score),
    }),
    { total: 0, completed: 0, pending: 0, execution: 0, verification: 0 }
  );

  const avgExecution = data.length > 0 ? totals.execution / data.length : 0;
  const avgVerification = data.length > 0 ? totals.verification / data.length : 0;

  if (isMobile) {
    return (
      <div className="space-y-3">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Execution Score</p>
                <p className="text-2xl font-bold">{avgExecution.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10">
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Verification Score</p>
                <p className="text-2xl font-bold">{avgVerification.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team/User Cards */}
        <div className="space-y-3">
          {data.map((row, idx) => (
            <Card key={idx} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">{row.user_name || 'Unknown'}</CardTitle>
                    <CardDescription className="text-xs">{row.team_name || 'No Team'}</CardDescription>
                  </div>
                  <Badge variant={Number(row.completion_rate) >= 80 ? "default" : "secondary"}>
                    {Number(row.completion_rate).toFixed(0)}% Complete
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold">{row.total_checklists}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Done
                    </p>
                    <p className="text-lg font-semibold text-green-600">{row.completed_checklists}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3 text-orange-500" />
                      Pending
                    </p>
                    <p className="text-lg font-semibold text-orange-600">{row.pending_checklists}</p>
                  </div>
                </div>
                
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Execution</span>
                    <span className="font-semibold">{Number(row.avg_execution_score).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Verification</span>
                    <span className="font-semibold">{Number(row.avg_verification_score).toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Checklist Report</CardTitle>
        <CardDescription>{new Date(date).toLocaleDateString()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Checklists</p>
              <p className="text-2xl font-bold">{totals.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-600">{totals.completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg Execution Score</p>
              <p className="text-2xl font-bold">{avgExecution.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg Verification Score</p>
              <p className="text-2xl font-bold">{avgVerification.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">Completed</TableHead>
              <TableHead className="text-center">Pending</TableHead>
              <TableHead className="text-center">Execution</TableHead>
              <TableHead className="text-center">Verification</TableHead>
              <TableHead className="text-center">Completion Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.team_name || 'No Team'}</TableCell>
                <TableCell>{row.user_name || 'Unknown'}</TableCell>
                <TableCell className="text-center">{row.total_checklists}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-green-600">
                    {row.completed_checklists}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-orange-600">
                    {row.pending_checklists}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-medium">
                  {Number(row.avg_execution_score).toFixed(1)}%
                </TableCell>
                <TableCell className="text-center font-medium">
                  {Number(row.avg_verification_score).toFixed(1)}%
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={Number(row.completion_rate) >= 80 ? "default" : "secondary"}>
                    {Number(row.completion_rate).toFixed(1)}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
