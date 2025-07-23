
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePersonalTasks } from '@/hooks/usePersonalTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Project } from '@/types';
import { Plus, TrendingUp, Calendar, Clock, Target, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EnhancedCreateTaskDialog from '@/components/task/EnhancedCreateTaskDialog';
import { useTask } from '@/contexts/task';
import { isTaskOverdue } from '@/utils/taskUtils';
import { calculateDailyScore } from '@/contexts/task/taskMetrics';
import { useTaskRealtime } from '@/hooks/useTaskRealtime';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import SwipeableTaskCard from '@/components/mobile/SwipeableTaskCard';
import FloatingActionButton from '@/components/mobile/FloatingActionButton';
import SkeletonCard from '@/components/mobile/SkeletonCard';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MobileDashboardPage = () => {
  const { user } = useAuth();
  
  // Add real-time subscription
  useTaskRealtime();
  
  const { tasks: personalTasks, isLoading: tasksLoading } = usePersonalTasks();
  const { projects, isLoading: projectsLoading, refreshProjects } = useProjects();
  
  const { updateTaskStatus } = useTask();
  
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  
  const tasks = personalTasks;
  const isLoading = tasksLoading || projectsLoading;
  
  // Calculate daily score
  const personalDailyScore = useMemo(() => {
    return calculateDailyScore(tasks);
  }, [tasks]);
  
  // Memoize task calculations
  const { todaysTasks, upcomingTasks, overdueTasks } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const todaysTasks = tasks.filter((task) => {
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
    
    const upcomingTasks = tasks.filter((task) => {
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate > today && taskDate <= nextWeek;
    }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    const overdueTasks = tasks.filter((task) => isTaskOverdue(task));
    
    return { todaysTasks, upcomingTasks, overdueTasks };
  }, [tasks]);

  // Handlers
  const handlePullToRefresh = useCallback(async () => {
    try {
      await refreshProjects();
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Pull to refresh failed:', error);
    }
  }, [refreshProjects]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  }, []);

  const handleCreateTask = useCallback(() => {
    setEditingTask(undefined);
    setIsCreateTaskOpen(true);
  }, []);

  const handleTaskDialogComplete = useCallback(() => {
    setIsCreateTaskOpen(false);
    setEditingTask(undefined);
  }, []);

  const onStatusChange = async (taskId: string, status: string): Promise<void> => {
    try {
      setIsUpdatingStatus(taskId);
      
      const validStatuses = ['To Do', 'In Progress', 'Completed'];
      if (!validStatuses.includes(status)) {
        toast.error('Invalid status selected');
        return;
      }

      await updateTaskStatus(taskId, status as Task['status']);
      toast.success(`Task status updated to ${status}`);
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task status. Please try again.');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Stats cards data
  const statsCards = [
    {
      title: 'Daily Score',
      value: `${personalDailyScore.percentage}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Today',
      value: todaysTasks.length,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Upcoming',
      value: upcomingTasks.length,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Overdue',
      value: overdueTasks.length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    }
  ];

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} variant="compact" />
        ))}
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handlePullToRefresh}>
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                      <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                        <Icon className={cn("h-5 w-5", stat.color)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Today's Tasks */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Today's Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todaysTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No tasks for today</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={handleCreateTask}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                </div>
              ) : (
                todaysTasks.map((task) => (
                  <SwipeableTaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onStatusChange={onStatusChange}
                    onDelete={() => {}}
                    onClick={() => {}}
                    isUpdating={isUpdatingStatus === task.id}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Overdue Tasks */}
          {overdueTasks.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Overdue Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {overdueTasks.map((task) => (
                  <SwipeableTaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onStatusChange={onStatusChange}
                    onDelete={() => {}}
                    onClick={() => {}}
                    isUpdating={isUpdatingStatus === task.id}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Tasks */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Upcoming Work
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming tasks</p>
                </div>
              ) : (
                upcomingTasks.slice(0, 3).map((task) => (
                  <SwipeableTaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onStatusChange={onStatusChange}
                    onDelete={() => {}}
                    onClick={() => {}}
                    isUpdating={isUpdatingStatus === task.id}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Bottom padding for tab bar */}
          <div className="h-4" />
        </div>

        {/* Floating Action Button */}
        <FloatingActionButton
          onCreateTask={handleCreateTask}
          onStartTimer={() => {}}
        />

        {/* Create Task Dialog */}
        <EnhancedCreateTaskDialog 
          open={isCreateTaskOpen} 
          onOpenChange={setIsCreateTaskOpen}
          editingTask={editingTask}
          onTaskComplete={handleTaskDialogComplete}
        />
      </div>
    </PullToRefresh>
  );
};

export default MobileDashboardPage;
