import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEmployeeReports } from '@/hooks/useEmployeeReports';
import { useEnhancedExport } from '@/hooks/useEnhancedExport';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  BarChart3,
  Download,
  Calendar,
  Award
} from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface PerformanceOverviewProps {
  memberId: string;
  teamId: string;
  timeRange: string;
}

export function PerformanceOverview({ memberId, teamId, timeRange }: PerformanceOverviewProps) {
  const { 
    taskStats, 
    hoursStats, 
    contributions, 
    isLoading, 
    error 
  } = useEmployeeReports({ 
    userId: memberId, 
    timeRange 
  });

  const exportData = useEnhancedExport(
    [], // tasks will be loaded from API
    [], // projects will be loaded from API
    [], // team members will be loaded from API
    {
      type: 'overview',
      timeRange,
      selectedProjects: [],
      selectedMembers: [memberId],
      selectedUser: memberId
    }
  );

  const handleExport = () => {
    // TODO: Implement CSV export using the enhanced export data
    console.log('Exporting overview data:', exportData);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2" />
              <div className="h-3 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Error Loading Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Unable to load performance data. Please try again later.
          </p>
          <p className="text-sm text-destructive mt-2">
            {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Mock data for demonstration - replace with actual API data
  const performanceMetrics = {
    completionRate: 87,
    productivityScore: 92,
    qualityScore: 89,
    onTimeDelivery: 94,
    tasksCompleted: 24,
    tasksInProgress: 6,
    hoursWorked: 38.5,
    overtimeHours: 2.5,
    trainingCompleted: 3,
    goalsAchieved: 8,
    totalGoals: 10
  };

  const kpiCards = [
    {
      title: 'Task Completion Rate',
      value: `${performanceMetrics.completionRate}%`,
      progress: performanceMetrics.completionRate,
      trend: '+5%',
      trendDirection: 'up',
      icon: CheckCircle2,
      color: 'text-success'
    },
    {
      title: 'Productivity Score',
      value: `${performanceMetrics.productivityScore}%`,
      progress: performanceMetrics.productivityScore,
      trend: '+8%',
      trendDirection: 'up',
      icon: TrendingUp,
      color: 'text-success'
    },
    {
      title: 'Quality Score',
      value: `${performanceMetrics.qualityScore}%`,
      progress: performanceMetrics.qualityScore,
      trend: '+2%',
      trendDirection: 'up',
      icon: Award,
      color: 'text-success'
    },
    {
      title: 'On-Time Delivery',
      value: `${performanceMetrics.onTimeDelivery}%`,
      progress: performanceMetrics.onTimeDelivery,
      trend: '-1%',
      trendDirection: 'down',
      icon: Target,
      color: 'text-warning'
    }
  ];

  const activityMetrics = [
    {
      title: 'Tasks Completed',
      value: performanceMetrics.tasksCompleted.toString(),
      subtitle: `${performanceMetrics.tasksInProgress} in progress`,
      icon: CheckCircle2,
      color: 'bg-success/10 text-success'
    },
    {
      title: 'Hours Worked',
      value: `${performanceMetrics.hoursWorked}h`,
      subtitle: `${performanceMetrics.overtimeHours}h overtime`,
      icon: Clock,
      color: 'bg-primary/10 text-primary'
    },
    {
      title: 'Training Completed',
      value: performanceMetrics.trainingCompleted.toString(),
      subtitle: 'Courses this period',
      icon: Award,
      color: 'bg-accent/10 text-accent'
    },
    {
      title: 'Goals Achieved',
      value: `${performanceMetrics.goalsAchieved}/${performanceMetrics.totalGoals}`,
      subtitle: `${Math.round((performanceMetrics.goalsAchieved / performanceMetrics.totalGoals) * 100)}% success rate`,
      icon: Target,
      color: 'bg-warning/10 text-warning'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Performance Overview</h2>
          <p className="text-muted-foreground">
            {timeRange} • {format(new Date(), 'MMM dd, yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.trendDirection === 'up' ? TrendingUp : TrendingDown;
          const trendColor = kpi.trendDirection === 'up' ? 'text-success' : 'text-destructive';
          
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </CardTitle>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center justify-between">
                  <Progress value={kpi.progress} className="flex-1" />
                  <div className={`flex items-center gap-1 text-sm ${trendColor} ml-2`}>
                    <TrendIcon className="w-3 h-3" />
                    {kpi.trend}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {activityMetrics.map((metric, index) => {
          const Icon = metric.icon;
          
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${metric.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{metric.value}</div>
                <p className="text-sm text-muted-foreground">{metric.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-success flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Strengths
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  High productivity score indicates efficient work habits
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  Excellent task completion rate above team average
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  Strong commitment to professional development
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-warning flex items-center gap-2">
                <Target className="w-4 h-4" />
                Growth Opportunities
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  Slight decrease in on-time delivery - time management focus
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  Consider workload balance to reduce overtime
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  Continue progress on remaining quarterly goals
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Overall Performance Rating</h4>
                <p className="text-sm text-muted-foreground">Based on all metrics</p>
              </div>
              <Badge variant="default" className="text-lg px-4 py-2">
                Excellent
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}