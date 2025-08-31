import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Users, 
  TrendingUp, 
  Calendar,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface TeamStats {
  teamId: string;
  teamName: string;
  memberCount: number;
  totalHours: number;
  scheduledHours: number;
  activeMembers: number;
  overtimeHours: number;
  complianceIssues: number;
  weeklyTarget: number;
}

interface TeamTotalsViewProps {
  teamStats: TeamStats[];
  selectedTeamId: string | null;
  weekDate: Date;
  isLoading?: boolean;
}

export const TeamTotalsView: React.FC<TeamTotalsViewProps> = ({
  teamStats,
  selectedTeamId,
  weekDate,
  isLoading = false
}) => {
  const currentWeekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });

  // Filter stats based on selection
  const displayStats = selectedTeamId 
    ? teamStats.filter(stat => stat.teamId === selectedTeamId)
    : teamStats;

  // Calculate totals across all displayed teams
  const totals = displayStats.reduce((acc, stat) => ({
    totalHours: acc.totalHours + stat.totalHours,
    scheduledHours: acc.scheduledHours + stat.scheduledHours,
    activeMembers: acc.activeMembers + stat.activeMembers,
    totalMembers: acc.totalMembers + stat.memberCount,
    overtimeHours: acc.overtimeHours + stat.overtimeHours,
    complianceIssues: acc.complianceIssues + stat.complianceIssues,
    weeklyTarget: acc.weeklyTarget + stat.weeklyTarget
  }), {
    totalHours: 0,
    scheduledHours: 0,
    activeMembers: 0,
    totalMembers: 0,
    overtimeHours: 0,
    complianceIssues: 0,
    weeklyTarget: 0
  });

  const completionPercentage = totals.weeklyTarget > 0 
    ? Math.round((totals.totalHours / totals.weeklyTarget) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Performance Overview</h2>
          <p className="text-muted-foreground">
            Week of {format(currentWeekStart, 'MMM d')} - {format(currentWeekEnd, 'MMM d, yyyy')}
          </p>
        </div>
        <Badge variant={completionPercentage >= 100 ? 'default' : 'secondary'}>
          {completionPercentage}% of weekly target
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              of {totals.weeklyTarget} targeted
            </p>
            <Progress 
              value={completionPercentage} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              of {totals.totalMembers} total members
            </p>
            <Progress 
              value={(totals.activeMembers / totals.totalMembers) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totals.overtimeHours.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((totals.overtimeHours / totals.totalHours) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            {totals.complianceIssues > 0 
              ? <AlertTriangle className="h-4 w-4 text-destructive" />
              : <CheckCircle2 className="h-4 w-4 text-green-600" />
            }
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              totals.complianceIssues > 0 ? 'text-destructive' : 'text-green-600'
            }`}>
              {totals.complianceIssues}
            </div>
            <p className="text-xs text-muted-foreground">
              {totals.complianceIssues === 0 ? 'All compliant' : 'Issues detected'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Individual Team Breakdown */}
      {displayStats.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayStats.map((team) => {
                const teamCompletion = team.weeklyTarget > 0 
                  ? (team.totalHours / team.weeklyTarget) * 100 
                  : 0;

                return (
                  <div key={team.teamId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{team.teamName}</h4>
                        <Badge variant="outline" className="text-xs">
                          {team.memberCount} members
                        </Badge>
                        {team.complianceIssues > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {team.complianceIssues} issues
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{team.totalHours.toFixed(1)}h worked</span>
                        <span>{team.activeMembers}/{team.memberCount} active</span>
                        {team.overtimeHours > 0 && (
                          <span className="text-orange-600">
                            {team.overtimeHours.toFixed(1)}h overtime
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {teamCompletion.toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          of target
                        </div>
                      </div>
                      <Progress 
                        value={teamCompletion} 
                        className="w-20" 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};