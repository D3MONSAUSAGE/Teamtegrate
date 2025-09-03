import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { MetricCardsGrid } from './MetricCardsGrid';
import { useTeamTotalMetrics } from '@/hooks/useTimeManagementMetrics';

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

  const teamMetrics = useTeamTotalMetrics(totals);

  if (isLoading) {
    return (
      <MetricCardsGrid 
        metrics={[]}
        isLoading={true}
      />
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
      <MetricCardsGrid 
        metrics={teamMetrics}
        isLoading={isLoading}
      />

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