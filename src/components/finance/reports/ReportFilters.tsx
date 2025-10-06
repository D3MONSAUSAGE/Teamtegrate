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
    <div className="space-y-3">
      {/* Horizontal Filter Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Time Range Selector */}
        {showTimeRange && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Time Range</label>
            <TimeRangeSelector
              timeRange={timeRange}
              dateRange={dateRange}
              onTimeRangeChange={onTimeRangeChange}
              onDateRangeChange={onDateRangeChange}
            />
          </div>
        )}
        
        {/* Team Selector - Only for managers and above */}
        {canSelectTeam && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Select Team</label>
            <CardTeamSelector
              selectedTeamId={selectedTeamId}
              onTeamChange={onTeamChange}
            />
          </div>
        )}
        
        {/* Individual User Selector */}
        {canSelectTeam && onUserChange && (
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

      {/* Compact Filter Summary */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground px-1">
        <span className="font-medium">Active filters:</span>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
            📅 {calculatedDateRange.label}
          </span>
          {canSelectTeam && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
              👥 <TeamNameResolver teamId={selectedTeamId} />
            </span>
          )}
          {canSelectTeam && selectedUserId && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
              👤 Individual User
            </span>
          )}
          {!canSelectTeam && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
              👥 Your Team Data
            </span>
          )}
        </div>
      </div>
    </div>
  );
};