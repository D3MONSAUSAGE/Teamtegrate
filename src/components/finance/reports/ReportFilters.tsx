import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TimeRangeSelector } from '@/components/reports/TimeRangeSelector';
import { CardTeamSelector } from '@/components/teams';
import { TeamNameResolver } from '@/components/finance/reports/TeamNameResolver';
import { IndividualUserSelector } from '@/components/finance/reports/IndividualUserSelector';

import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import { DateRange } from 'react-day-picker';
import { CalculatedDateRange } from '@/utils/dateRangeUtils';

interface ReportFiltersProps {
  timeRange: string;
  dateRange?: DateRange;
  selectedTeamId: string | null;
  selectedUserId?: string | null;
  onTimeRangeChange: (range: string) => void;
  onDateRangeChange: (range?: DateRange) => void;
  onTeamChange: (teamId: string | null) => void;
  onUserChange?: (userId: string | null) => void;
  calculatedDateRange: CalculatedDateRange;
  showTimeRange?: boolean; // Add prop to control time range visibility
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  timeRange,
  dateRange,
  selectedTeamId,
  selectedUserId,
  onTimeRangeChange,
  onDateRangeChange,
  onTeamChange,
  onUserChange,
  calculatedDateRange,
  showTimeRange = true
}) => {
  const { user } = useAuth();

  if (!user) return null;

  const canSelectTeam = hasRoleAccess(user.role, 'manager');

  return (
    <div className="space-y-4">
      {/* Date Range Filter - Only show if enabled */}
      {showTimeRange && (
        <TimeRangeSelector
          timeRange={timeRange}
          dateRange={dateRange}
          onTimeRangeChange={onTimeRangeChange}
          onDateRangeChange={onDateRangeChange}
        />
      )}

      {/* Team and User Filters - Side by side for managers and above */}
      {canSelectTeam && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Select Team</label>
            <CardTeamSelector
              selectedTeamId={selectedTeamId}
              onTeamChange={onTeamChange}
            />
          </div>
          
          {onUserChange && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Select Individual</label>
              <IndividualUserSelector
                selectedUserId={selectedUserId}
                selectedTeamId={selectedTeamId}
                onUserChange={onUserChange}
              />
            </div>
          )}
        </div>
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
              {canSelectTeam && selectedUserId && (
                <span>👤 Individual User</span>
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