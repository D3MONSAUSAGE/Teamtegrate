import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeePerformance } from '@/hooks/useEmployeePerformance';
import { useTaskTeamPerformance } from '@/hooks/useTaskTeamPerformance';
import { useOrgLeaderboard } from '@/hooks/useOrgLeaderboard';
import { EmployeeScoreCard } from './EmployeeScoreCard';
import { TeamLeaderboard } from './TeamLeaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Zap, Target } from 'lucide-react';
import type { ReportFilter } from '@/types/reports';

interface PerformanceTabProps {
  filter: ReportFilter;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ filter }) => {
  const { user } = useAuth();

  const startDate = filter.view === 'weekly' && filter.weekStartISO
    ? new Date(filter.weekStartISO)
    : new Date(filter.dateISO);
  
  const endDate = filter.view === 'weekly' && filter.weekStartISO
    ? new Date(new Date(filter.weekStartISO).setDate(new Date(filter.weekStartISO).getDate() + 6))
    : new Date(filter.dateISO);

  const { data: employeePerformance, isLoading: isLoadingEmployee } = useEmployeePerformance({
    userId: filter.userId || user?.id,
    startDate,
    endDate,
    timezone: filter.timezone,
    organizationId: filter.orgId
  });

  const { data: teamPerformance, isLoading: isLoadingTeams } = useTaskTeamPerformance({
    teamIds: filter.teamIds,
    startDate,
    endDate,
    timezone: filter.timezone,
    organizationId: filter.orgId
  });

  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useOrgLeaderboard({
    startDate,
    endDate,
    timezone: filter.timezone,
    organizationId: filter.orgId,
    limit: 10
  });

  if (isLoadingEmployee || isLoadingTeams || isLoadingLeaderboard) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading performance data...</div>
      </div>
    );
  }

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'Top Performer': return <Trophy className="h-3 w-3" />;
      case 'Quality Master': return <Award className="h-3 w-3" />;
      case 'High Volume': return <Zap className="h-3 w-3" />;
      case 'Consistent': return <Target className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Employee Performance */}
      {employeePerformance && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Your Performance</h3>
          <EmployeeScoreCard performance={employeePerformance} />
        </div>
      )}

      {/* Organization Leaderboard */}
      {leaderboard && leaderboard.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaderboard.map((entry) => (
                <div
                  key={entry.user_id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                      {entry.rank}
                    </div>
                    <div>
                      <div className="font-medium">{entry.user_name}</div>
                      <div className="text-sm text-muted-foreground">{entry.team_name || 'No Team'}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entry.badges.map((badge) => (
                          <Badge key={badge} variant="secondary" className="text-xs">
                            <span className="mr-1">{getBadgeIcon(badge)}</span>
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{entry.total_score.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">
                      {entry.completed_tasks} tasks • {entry.completion_rate.toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Performance */}
      {teamPerformance && teamPerformance.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Team Performance</h3>
          <TeamLeaderboard teams={teamPerformance} />
        </div>
      )}
    </div>
  );
};
