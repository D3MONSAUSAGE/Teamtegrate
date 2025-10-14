import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimeRangeSelector } from '@/components/reports/TimeRangeSelector';
import { CardTeamSelector } from '@/components/teams';
import { TeamNameResolver } from '@/components/finance/reports/TeamNameResolver';
import { IndividualUserSelector } from '@/components/finance/reports/IndividualUserSelector';
import { Calendar, Users, User } from 'lucide-react';

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
      {/* Responsive Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Time Range Selector */}
        {showTimeRange && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Time Range
            </label>
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
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Team
            </label>
            <CardTeamSelector
              selectedTeamId={selectedTeamId}
              onTeamChange={onTeamChange}
            />
          </div>
        )}
        
        {/* Individual User Selector */}
        {canSelectTeam && onUserChange && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Individual
            </label>
            <IndividualUserSelector
              selectedUserId={selectedUserId}
              selectedTeamId={selectedTeamId}
              onUserChange={onUserChange}
            />
          </div>
        )}
      </div>

      {/* Filter Summary with Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/50">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Active:</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
              <Calendar className="h-3.5 w-3.5" />
              {calculatedDateRange.label}
            </span>
            {canSelectTeam && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                <Users className="h-3.5 w-3.5" />
                <TeamNameResolver teamId={selectedTeamId} />
              </span>
            )}
            {canSelectTeam && selectedUserId && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                <User className="h-3.5 w-3.5" />
                Individual
              </span>
            )}
            {!canSelectTeam && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                <Users className="h-3.5 w-3.5" />
                Your Team
              </span>
            )}
          </div>
        </div>
        
        {(selectedTeamId || selectedUserId) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onTeamChange(null);
              onUserChange?.(null);
            }}
            className="text-xs sm:text-sm min-h-[36px]"
          >
            Reset Filters
          </Button>
        )}
      </div>
    </div>
  );
};