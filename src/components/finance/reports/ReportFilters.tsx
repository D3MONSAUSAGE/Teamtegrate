import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TimeRangeSelector } from '@/components/reports/personal/TimeRangeSelector';
import { EnhancedTeamSelector } from '@/components/finance/reports/EnhancedTeamSelector';
import { TeamNameResolver } from '@/components/finance/reports/TeamNameResolver';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import { DateRange } from 'react-day-picker';
import { CalculatedDateRange } from '@/utils/dateRangeUtils';

interface ReportFiltersProps {
  timeRange: string;
  dateRange?: DateRange;
  selectedTeamId: string | null;
  onTimeRangeChange: (range: string) => void;
  onDateRangeChange: (range?: DateRange) => void;
  onTeamChange: (teamId: string | null) => void;
  calculatedDateRange: CalculatedDateRange;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  timeRange,
  dateRange,
  selectedTeamId,
  onTimeRangeChange,
  onDateRangeChange,
  onTeamChange,
  calculatedDateRange
}) => {
  const { user } = useAuth();

  if (!user) return null;

  const canSelectTeam = hasRoleAccess(user.role, 'manager');

  return (
    <div className="space-y-4">
      {/* Date Range Filter */}
      <TimeRangeSelector
        timeRange={timeRange}
        dateRange={dateRange}
        onTimeRangeChange={onTimeRangeChange}
        onDateRangeChange={onDateRangeChange}
      />

      {/* Team Filter - Only for managers and above */}
      {canSelectTeam && (
        <EnhancedTeamSelector
          selectedTeamId={selectedTeamId}
          onTeamChange={onTeamChange}
        />
      )}

      {/* Filter Summary */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">Filtered by:</span>
            <div className="flex flex-wrap items-center gap-4">
              <span>📅 {calculatedDateRange.label}</span>
              {canSelectTeam && (
                <span>👥 <TeamNameResolver teamId={selectedTeamId} /></span>
              )}
              {!canSelectTeam && (
                <span>👥 Your Team Data</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};