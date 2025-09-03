import { useMemo } from 'react';
import { 
  Clock, 
  Users, 
  Calendar, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Activity
} from 'lucide-react';
import { MetricData } from '@/components/time-management/MetricCardsGrid';

interface BaseStats {
  totalHours: number;
  activeMembers: number;
  totalMembers: number;
  overtimeHours: number;
  complianceIssues: number;
  weeklyTarget?: number;
}

interface ScheduleStats extends BaseStats {
  thisWeekShifts: number;
  coverage: number;
}

interface TeamStats extends BaseStats {
  scheduledHours: number;
}

export const useScheduleMetrics = (stats: ScheduleStats): MetricData[] => {
  return useMemo(() => [
    {
      id: 'shifts',
      title: 'This Week Shifts',
      value: stats.thisWeekShifts,
      subtitle: 'Scheduled shifts',
      icon: Calendar,
      change: { value: '+12%', trend: 'up' },
      progress: 75,
      gradient: "from-primary/10 to-primary/5"
    },
    {
      id: 'team',
      title: 'Active Team',
      value: stats.activeMembers,
      subtitle: 'Team members',
      icon: Users,
      change: { value: '+3', trend: 'up' },
      progress: Math.round((stats.activeMembers / stats.totalMembers) * 100),
      gradient: "from-accent/10 to-accent/5"
    },
    {
      id: 'hours',
      title: 'Total Hours',
      value: `${stats.totalHours}h`,
      subtitle: 'This week',
      icon: Clock,
      change: { value: '+18h', trend: 'up' },
      progress: 92,
      gradient: "from-success/10 to-success/5"
    },
    {
      id: 'coverage',
      title: 'Coverage Rate',
      value: `${stats.coverage}%`,
      subtitle: 'Schedule coverage',
      icon: Target,
      change: { value: '+5%', trend: 'up' },
      progress: stats.coverage,
      gradient: "from-warning/10 to-warning/5"
    }
  ], [stats]);
};

export const useTeamTotalMetrics = (stats: TeamStats): MetricData[] => {
  const completionPercentage = stats.weeklyTarget 
    ? Math.round((stats.totalHours / stats.weeklyTarget) * 100)
    : 0;

  return useMemo(() => [
    {
      id: 'total-hours',
      title: 'Total Hours',
      value: stats.totalHours.toFixed(1),
      subtitle: stats.weeklyTarget ? `of ${stats.weeklyTarget} targeted` : 'This week',
      icon: Clock,
      progress: completionPercentage,
      gradient: "from-primary/10 to-primary/5"
    },
    {
      id: 'active-members',
      title: 'Active Members',
      value: stats.activeMembers,
      subtitle: `of ${stats.totalMembers} total members`,
      icon: Users,
      progress: Math.round((stats.activeMembers / stats.totalMembers) * 100),
      gradient: "from-accent/10 to-accent/5"
    },
    {
      id: 'overtime',
      title: 'Overtime Hours',
      value: stats.overtimeHours.toFixed(1),
      subtitle: `${((stats.overtimeHours / stats.totalHours) * 100).toFixed(1)}% of total`,
      icon: TrendingUp,
      badge: stats.overtimeHours > 0 ? {
        text: 'High',
        variant: 'destructive' as const
      } : undefined,
      gradient: "from-warning/10 to-warning/5"
    },
    {
      id: 'compliance',
      title: 'Compliance',
      value: stats.complianceIssues,
      subtitle: stats.complianceIssues === 0 ? 'All compliant' : 'Issues detected',
      icon: stats.complianceIssues > 0 ? AlertTriangle : CheckCircle2,
      badge: {
        text: stats.complianceIssues > 0 ? 'Issues' : 'Clean',
        variant: stats.complianceIssues > 0 ? 'destructive' : 'default'
      },
      gradient: stats.complianceIssues > 0 
        ? "from-destructive/10 to-destructive/5" 
        : "from-success/10 to-success/5"
    }
  ], [stats, completionPercentage]);
};