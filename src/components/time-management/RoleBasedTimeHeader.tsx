import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Users, 
  Shield, 
  Calendar, 
  Settings,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { UserRole } from '@/types';

interface RoleBasedTimeHeaderProps {
  userRole: UserRole;
  userName: string;
  selectedTeamName?: string;
  selectedUserName?: string;
  viewMode?: 'time-tracking' | 'schedule' | 'entries' | 'team-overview';
  hasComplianceIssues?: boolean;
  onQuickAction?: (action: 'export' | 'settings' | 'reports') => void;
}

export const RoleBasedTimeHeader: React.FC<RoleBasedTimeHeaderProps> = ({
  userRole,
  userName,
  selectedTeamName,
  selectedUserName,
  viewMode = 'time-tracking',
  hasComplianceIssues = false,
  onQuickAction
}) => {
  const getRoleIcon = () => {
    switch (userRole) {
      case 'superadmin':
      case 'admin':
        return <Shield className="h-5 w-5" />;
      case 'manager':
        return <Users className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'superadmin':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'manager':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'time-tracking':
        return userRole === 'user' ? 'Personal Time Tracking' : 'Time Management Dashboard';
      case 'schedule':
        return 'Schedule Management';
      case 'entries':
        return 'Time Entries Management';
      case 'team-overview':
        return 'Team Performance Overview';
      default:
        return 'Time Management';
    }
  };

  const getViewDescription = () => {
    if (userRole === 'user') {
      return 'Track your work hours, breaks, and view your daily summaries';
    }

    switch (viewMode) {
      case 'time-tracking':
        return 'Monitor and manage time tracking across your organization';
      case 'schedule':
        return 'Create and manage employee schedules and availability';
      case 'entries':
        return 'Review, edit, and approve employee time entries';
      case 'team-overview':
        return 'Analyze team performance and productivity metrics';
      default:
        return 'Comprehensive time management and scheduling system';
    }
  };

  const canShowQuickActions = ['admin', 'superadmin', 'manager'].includes(userRole);

  return (
    <div className="space-y-4">
      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getRoleIcon()}
              <h1 className="text-3xl font-bold tracking-tight">
                {getViewTitle()}
              </h1>
            </div>
            <Badge variant={getRoleColor()}>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
            {hasComplianceIssues && (
              <Badge variant="destructive" className="animate-pulse">
                <AlertCircle className="h-3 w-3 mr-1" />
                Issues
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {getViewDescription()}
          </p>
        </div>

        {/* Quick Actions */}
        {canShowQuickActions && onQuickAction && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onQuickAction('reports')}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Reports
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onQuickAction('export')}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onQuickAction('settings')}
            >
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        )}
      </div>

      {/* Context Information */}
      {(selectedTeamName || selectedUserName) && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Current Context:</span>
          {selectedTeamName && (
            <Badge variant="secondary">
              <Users className="h-3 w-3 mr-1" />
              Team: {selectedTeamName}
            </Badge>
          )}
          {selectedUserName && (
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              Employee: {selectedUserName}
            </Badge>
          )}
        </div>
      )}

      {/* Role-Specific Quick Info */}
      {userRole === 'user' && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Welcome back, {userName}! Use the controls below to manage your time tracking.
          </p>
        </div>
      )}

      {['manager', 'admin', 'superadmin'].includes(userRole) && !selectedTeamName && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Tip:</strong> Select a team from the navigation controls above to view specific team data and manage employees.
          </p>
        </div>
      )}
    </div>
  );
};