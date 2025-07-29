import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Users, CheckSquare, Clock, FolderKanban, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsOverviewProps {
  totalTasks: number;
  completedTasks: number;
  teamMembers: number;
  activeProjects: number;
  averageCompletionRate: number;
  trendsData: {
    tasksChange: number;
    completionRateChange: number;
    productivityScore: number;
  };
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
  totalTasks,
  completedTasks,
  teamMembers,
  activeProjects,
  averageCompletionRate,
  trendsData
}) => {
  const kpiCards = [
    {
      title: "Total Tasks",
      value: totalTasks,
      icon: CheckSquare,
      trend: trendsData.tasksChange,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      title: "Completed",
      value: completedTasks,
      icon: Target,
      trend: trendsData.completionRateChange,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20"
    },
    {
      title: "Team Members",
      value: teamMembers,
      icon: Users,
      trend: 0,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      title: "Active Projects",
      value: activeProjects,
      icon: FolderKanban,
      trend: 0,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20"
    }
  ];

  const TrendIcon = ({ trend }: { trend: number }) => {
    if (trend > 0) return <TrendingUp className="w-3 h-3 text-emerald-600" />;
    if (trend < 0) return <TrendingDown className="w-3 h-3 text-red-600" />;
    return null;
  };

  const getProductivityLevel = (score: number) => {
    if (score >= 90) return { label: "Excellent", color: "bg-emerald-500" };
    if (score >= 75) return { label: "Good", color: "bg-blue-500" };
    if (score >= 60) return { label: "Average", color: "bg-yellow-500" };
    return { label: "Needs Improvement", color: "bg-red-500" };
  };

  const productivityLevel = getProductivityLevel(trendsData.productivityScore);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className={cn("absolute inset-0 opacity-5", kpi.bgColor)} />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{kpi.value}</p>
                      {kpi.trend !== 0 && (
                        <div className="flex items-center gap-1">
                          <TrendIcon trend={kpi.trend} />
                          <span className={cn(
                            "text-xs font-medium",
                            kpi.trend > 0 ? "text-emerald-600" : "text-red-600"
                          )}>
                            {Math.abs(kpi.trend)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={cn("p-3 rounded-lg", kpi.bgColor)}>
                    <Icon className={cn("w-6 h-6", kpi.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Rate */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              Team Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Progress</span>
                <span className="text-lg font-semibold">{averageCompletionRate}%</span>
              </div>
              <Progress value={averageCompletionRate} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Productivity Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              Productivity Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{trendsData.productivityScore}</div>
                <Badge variant="secondary" className={cn("text-white", productivityLevel.color)}>
                  {productivityLevel.label}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Poor</span>
                  <span>Good</span>
                  <span>Excellent</span>
                </div>
                <Progress value={trendsData.productivityScore} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsOverview;