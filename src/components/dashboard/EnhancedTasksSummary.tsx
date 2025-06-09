
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DailyScore, Task } from '@/types';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Clock, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedTasksSummaryProps {
  dailyScore: DailyScore;
  todaysTasks: Task[];
  upcomingTasks: Task[];
}

const EnhancedTasksSummary: React.FC<EnhancedTasksSummaryProps> = ({
  dailyScore,
  todaysTasks,
  upcomingTasks
}) => {
  const completedToday = todaysTasks.filter(task => task.status === 'Completed').length;
  const completionRate = todaysTasks.length > 0 ? (completedToday / todaysTasks.length) * 100 : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Daily Score Card */}
      <Card className="modern-card overflow-hidden relative group hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/30 rounded-xl flex items-center justify-center">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
              {dailyScore.percentage}%
            </span>
          </div>
          <h3 className="font-semibold text-foreground mb-2">Daily Score</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {dailyScore.completedTasks} of {dailyScore.totalTasks} tasks completed
          </p>
          <Progress value={dailyScore.percentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Today's Tasks Card */}
      <Card className="modern-card overflow-hidden relative group hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-emerald-500/30 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-emerald-500" />
            </div>
            <span className="text-3xl font-bold text-foreground">
              {todaysTasks.length}
            </span>
          </div>
          <h3 className="font-semibold text-foreground mb-2">Today's Tasks</h3>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <p className="text-sm text-muted-foreground">
              {completedToday} completed
            </p>
          </div>
          <div className="w-full bg-muted/30 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Tasks Card */}
      <Card className="modern-card overflow-hidden relative group hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-500/30 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
            <span className="text-3xl font-bold text-foreground">
              {upcomingTasks.length}
            </span>
          </div>
          <h3 className="font-semibold text-foreground mb-2">Upcoming Tasks</h3>
          <p className="text-sm text-muted-foreground mb-3">Next 7 days</p>
          <div className="flex items-center gap-1">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 h-6 rounded-full transition-all duration-300",
                  i < Math.min(upcomingTasks.length, 7) 
                    ? "bg-gradient-to-t from-blue-500 to-blue-400" 
                    : "bg-muted/40"
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Trend Card */}
      <Card className="modern-card overflow-hidden relative group hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-500/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-orange-500" />
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-500">+12%</span>
            </div>
          </div>
          <h3 className="font-semibold text-foreground mb-2">Performance</h3>
          <p className="text-sm text-muted-foreground mb-3">vs last week</p>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-muted-foreground">Above average</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedTasksSummary;
