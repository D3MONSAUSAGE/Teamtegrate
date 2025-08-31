import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, BarChart3, User, FolderOpen } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

interface ExportPanelProps {
  selectedUserId: string;
  selectedUserName: string;
  timeRange: string;
  dateRange?: DateRange;
  onExport: (type: 'personal-overview' | 'personal-tasks' | 'personal-performance' | 'personal-projects') => void;
  isCurrentUser: boolean;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  selectedUserId,
  selectedUserName,
  timeRange,
  dateRange,
  onExport,
  isCurrentUser
}) => {
  const displayPeriod = React.useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`;
    }
    return timeRange === '7 days' ? 'This Week' : 
           timeRange === '30 days' ? 'This Month' : 'Custom Period';
  }, [dateRange, timeRange]);

  const exportActions = [
    {
      type: 'personal-overview' as const,
      label: isCurrentUser ? 'Export My Overview' : `Export ${selectedUserName}'s Overview`,
      description: 'General performance summary',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      type: 'personal-tasks' as const,
      label: isCurrentUser ? 'Export My Tasks' : `Export ${selectedUserName}'s Tasks`,
      description: 'Detailed task breakdown',
      icon: BarChart3,
      color: 'text-green-600'
    },
    {
      type: 'personal-performance' as const,
      label: isCurrentUser ? 'Export My Performance' : `Export ${selectedUserName}'s Performance`,
      description: 'Performance metrics & trends',
      icon: User,
      color: 'text-purple-600'
    },
    {
      type: 'personal-projects' as const,
      label: isCurrentUser ? 'Export My Projects' : `Export ${selectedUserName}'s Projects`,
      description: 'Project contributions',
      icon: FolderOpen,
      color: 'text-orange-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Reports
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Export {isCurrentUser ? 'your' : `${selectedUserName}'s`} performance data for {displayPeriod}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {exportActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.type}
              variant="outline"
              onClick={() => onExport(action.type)}
              className="w-full justify-start h-auto p-4"
            >
              <div className="flex items-center gap-3 w-full">
                <Icon className={`h-4 w-4 ${action.color}`} />
                <div className="text-left flex-1">
                  <p className="font-medium text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
                <Download className="h-3 w-3 text-muted-foreground" />
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};