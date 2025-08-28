import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, BookOpen, PenTool, Users, CheckCircle, TrendingUp, Activity } from 'lucide-react';
import { useTrainingStats } from '@/hooks/useTrainingData';

const TrainingStatsCards: React.FC = () => {
  const { data: stats, isLoading, error } = useTrainingStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="group relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-white/80 to-white/60 dark:from-card/80 dark:to-card/60">
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
            <p className="font-medium">Failed to load training statistics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statsData = [
    {
      title: "Training Courses",
      value: stats.total_courses,
      subtitle: "Available courses",
      icon: GraduationCap,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/10 dark:to-teal-950/10",
      progress: Math.min((stats.total_courses / 20) * 100, 100),
      maxValue: 100
    },
    {
      title: "Learning Modules",
      value: stats.total_modules,
      subtitle: "Content modules",
      icon: BookOpen,
      color: "from-teal-500 to-teal-600",
      bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20",
      progress: Math.min((stats.total_modules / 50) * 100, 100),
      maxValue: 100
    },
    {
      title: "Active Quizzes",
      value: stats.total_quizzes,
      subtitle: "Assessment tools",
      icon: PenTool,
      color: "from-cyan-500 to-cyan-600",
      bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20",
      progress: Math.min((stats.total_quizzes / 30) * 100, 100),
      maxValue: 100
    },
    {
      title: "Quiz Attempts",
      value: stats.total_attempts,
      subtitle: "Total submissions",
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20",
      progress: Math.min((stats.total_attempts / 100) * 100, 100),
      maxValue: 100
    },
    {
      title: "Passed Attempts",
      value: stats.passed_attempts,
      subtitle: `of ${stats.total_attempts} total`,
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
      progress: stats.total_attempts > 0 ? Math.round((stats.passed_attempts / stats.total_attempts) * 100) : 0,
      maxValue: 100
    },
    {
      title: "Success Rate",
      value: `${stats.completion_rate}%`,
      subtitle: "Overall performance",
      icon: TrendingUp,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20",
      progress: stats.completion_rate,
      maxValue: 100
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={stat.title}
            className={`group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer ${stat.bgColor}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent group-hover:scale-110 transition-transform`}>
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
                <div className={`p-2 rounded-full bg-gradient-to-r ${stat.color} group-hover:rotate-12 transition-transform`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </div>
              
              {stat.progress !== undefined && (
                <div className="space-y-2">
                  <Progress 
                    value={stat.progress} 
                    className="h-2 group-hover:h-3 transition-all duration-300" 
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{Math.round(stat.progress)}%</span>
                  </div>
                </div>
              )}
            </CardContent>
            
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </Card>
        );
      })}
    </div>
  );
};

export default TrainingStatsCards;