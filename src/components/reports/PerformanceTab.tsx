import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeePerformance } from '@/hooks/useEmployeePerformance';
import { useTaskTeamPerformance } from '@/hooks/useTaskTeamPerformance';
import { useOrgLeaderboard } from '@/hooks/useOrgLeaderboard';
import { EmployeeScoreCard } from './EmployeeScoreCard';
import { TeamLeaderboard } from './TeamLeaderboard';
import { PerformanceLeaderboard } from './redesigned/PerformanceLeaderboard';
import { EmptyStateCard } from './redesigned/EmptyStateCard';
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

  const isLoading = isLoadingEmployee || isLoadingTeams || isLoadingLeaderboard;
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-4" />
          <div className="h-64 bg-muted rounded-lg mb-4" />
          <div className="h-48 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  // Check if we have any data at all
  const hasEmployeeData = employeePerformance && employeePerformance.completed_tasks > 0;
  const hasLeaderboardData = leaderboard && leaderboard.length > 0;
  const hasTeamData = teamPerformance && teamPerformance.length > 0;
  const hasAnyData = hasEmployeeData || hasLeaderboardData || hasTeamData;

  if (!hasAnyData) {
    return (
      <div className="space-y-6">
        <EmptyStateCard
          title="No Performance Data Available"
          description="Start completing tasks to build your performance history. Performance metrics are calculated based on task completion rates, velocity, quality, and consistency over time."
          icon="chart"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Employee Performance */}
      {hasEmployeeData && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Your Performance</h3>
          <EmployeeScoreCard performance={employeePerformance} />
        </div>
      )}

      {/* Organization Leaderboard */}
      <PerformanceLeaderboard 
        leaderboard={leaderboard}
        isLoading={false}
      />

      {/* Team Performance */}
      {hasTeamData && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Team Performance</h3>
          <TeamLeaderboard teams={teamPerformance} />
        </div>
      )}
    </div>
  );
};
