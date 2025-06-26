
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, UserCheck, Briefcase, CheckCircle, Clock, TrendingUp, Activity } from 'lucide-react';
import { useOrganizationStats } from '@/hooks/useOrganizationStats';

const OrganizationStatsCards: React.FC = () => {
  const { stats, isLoading, error } = useOrganizationStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-lg bg-gradient-to-br from-white/80 to-white/60 dark:from-card/80 dark:to-card/60">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-20" />
                  <div className="h-6 w-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded" />
                </div>
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-16" />
                <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="border-destructive/20 shadow-lg bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <Activity className="h-5 w-5" />
            <p className="font-medium">Failed to load organization statistics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completionRate = stats.total_tasks > 0 
    ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) 
    : 0;

  const statsData = [
    {
      title: "Total Users",
      value: stats.total_users,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Admins",
      value: stats.admins + stats.superadmins,
      icon: Shield,
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20",
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      textColor: "text-purple-600 dark:text-purple-400",
      subtitle: `${stats.superadmins} super, ${stats.admins} admin`
    },
    {
      title: "Managers",
      value: stats.managers,
      icon: UserCheck,
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20",
      iconBg: "bg-green-100 dark:bg-green-900/30",
      textColor: "text-green-600 dark:text-green-400"
    },
    {
      title: "Active Projects",
      value: stats.active_projects,
      icon: Briefcase,
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20",
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      textColor: "text-orange-600 dark:text-orange-400"
    },
    {
      title: "Tasks Completed",
      value: stats.completed_tasks,
      icon: CheckCircle,
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      textColor: "text-emerald-600 dark:text-emerald-400",
      subtitle: `of ${stats.total_tasks} total`
    },
    {
      title: "Completion Rate",
      value: `${completionRate}%`,
      icon: TrendingUp,
      gradient: "from-indigo-500 to-indigo-600",
      bgGradient: "from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
      textColor: "text-indigo-600 dark:text-indigo-400"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {statsData.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card 
            key={stat.title}
            className={`border-0 shadow-lg hover:shadow-xl bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm transition-all duration-300 hover:scale-105 group cursor-pointer`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                <IconComponent className={`h-4 w-4 ${stat.textColor}`} />
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-1">
                <div className={`text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 inline-block`}>
                  {stat.value}
                </div>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                    {stat.subtitle}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default OrganizationStatsCards;
