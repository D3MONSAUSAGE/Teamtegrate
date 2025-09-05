import React, { useMemo } from 'react';
import { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Zap,
  Trophy
} from 'lucide-react';
import { format, isToday, differenceInDays, differenceInHours } from 'date-fns';

interface PersonalProductivityCenterProps {
  tasks: Task[];
  onEditTask?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: string) => Promise<void>;
}

const PersonalProductivityCenter: React.FC<PersonalProductivityCenterProps> = ({
  tasks,
  onEditTask,
  onStatusChange
}) => {
  const { priorityTasks, stats, weeklyGoal } = useMemo(() => {
    const today = new Date();
    
    // Get today's high-priority incomplete tasks
    const todaysTasks = tasks.filter(task => {
      const taskDate = new Date(task.deadline);
      return isToday(taskDate) && task.status !== 'Completed';
    });
    
    // Sort by priority (High > Medium > Low) and then by deadline
    const priorityTasks = todaysTasks
      .sort((a, b) => {
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      })
      .slice(0, 4);

    // Calculate personal statistics
    const completedToday = tasks.filter(task => 
      task.status === 'Completed' && isToday(new Date(task.updatedAt || task.createdAt))
    ).length;
    
    const totalToday = tasks.filter(task => isToday(new Date(task.deadline))).length;
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const completedThisWeek = tasks.filter(task => {
      const completedDate = new Date(task.updatedAt || task.createdAt);
      return task.status === 'Completed' && completedDate >= weekStart;
    }).length;
    
    const avgCompletionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
    
    const stats = {
      completedToday,
      totalToday,
      completedThisWeek,
      avgCompletionRate,
      productivityStreak: completedThisWeek
    };
    
    // Weekly goal calculation
    const weeklyGoal = {
      target: 20,
      current: completedThisWeek,
      percentage: Math.min((completedThisWeek / 20) * 100, 100)
    };

    return { priorityTasks, stats, weeklyGoal };
  }, [tasks]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'Medium': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
      case 'Low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getUrgencyInfo = (task: Task) => {
    const deadline = new Date(task.deadline);
    const now = new Date();
    const hoursLeft = differenceInHours(deadline, now);
    
    if (hoursLeft < 0) {
      return { text: 'Overdue', color: 'text-red-600', urgent: true };
    } else if (hoursLeft < 2) {
      return { text: `${hoursLeft}h left`, color: 'text-red-500', urgent: true };
    } else if (hoursLeft < 6) {
      return { text: `${hoursLeft}h left`, color: 'text-amber-500', urgent: false };
    } else {
      return { text: format(deadline, 'HH:mm'), color: 'text-muted-foreground', urgent: false };
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal Statistics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {stats.completedToday}
              </div>
              <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                Completed Today
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-400/10">
              <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {stats.avgCompletionRate}%
              </div>
              <div className="text-xs text-blue-600/80 dark:text-blue-400/80">
                Completion Rate
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 dark:bg-purple-400/10">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                {stats.completedThisWeek}
              </div>
              <div className="text-xs text-purple-600/80 dark:text-purple-400/80">
                This Week
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-xl p-4 border border-amber-200/50 dark:border-amber-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 dark:bg-amber-400/10">
              <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {stats.productivityStreak}
              </div>
              <div className="text-xs text-amber-600/80 dark:text-amber-400/80">
                Streak
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Goal Progress */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-5 border border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Weekly Goal</h3>
              <p className="text-sm text-muted-foreground">
                {weeklyGoal.current} of {weeklyGoal.target} tasks completed
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="font-medium">
            {Math.round(weeklyGoal.percentage)}%
          </Badge>
        </div>
        <Progress value={weeklyGoal.percentage} className="h-2" />
      </div>

      {/* Today's Priority Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Today's Priority Tasks</h3>
              <p className="text-sm text-muted-foreground">Focus on these high-impact items</p>
            </div>
          </div>
        </div>

        {priorityTasks.length === 0 ? (
          <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/30">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">All priority tasks completed!</p>
            <p className="text-sm text-muted-foreground/80">Great job staying on top of your work.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {priorityTasks.map((task) => {
              const urgencyInfo = getUrgencyInfo(task);
              
              return (
                <div
                  key={task.id}
                  className="group bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getPriorityColor(task.priority)} variant="secondary">
                          {task.priority}
                        </Badge>
                        <div className={`text-sm font-medium ${urgencyInfo.color}`}>
                          {urgencyInfo.urgent && <AlertCircle className="h-3 w-3 inline mr-1" />}
                          {urgencyInfo.text}
                        </div>
                      </div>
                      
                      <h4 className="font-semibold text-foreground mb-1 line-clamp-1">
                        {task.title}
                      </h4>
                      
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {task.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {onStatusChange && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onStatusChange(task.id, 'Completed')}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {onEditTask && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditTask(task)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Insights */}
      {stats.totalToday > 0 && (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/20 dark:to-slate-800/10 rounded-xl p-4 border border-slate-200/50 dark:border-slate-800/30">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Today's Insight</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {stats.avgCompletionRate >= 80 
              ? "Excellent progress today! You're ahead of schedule." 
              : stats.avgCompletionRate >= 50
              ? "Good momentum! Keep pushing to reach your daily goal."
              : "You've got this! Focus on your priority tasks to catch up."}
          </p>
        </div>
      )}
    </div>
  );
};

export default PersonalProductivityCenter;