import React, { useState } from 'react';
import { CheckCircle, Plus, UserPlus, AlertTriangle, TrendingUp } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { useDailyReport, useTaskReports, DailyDetailData } from '@/hooks/useTaskReports';
import { DateNavigation } from '@/components/reports/DateNavigation';
import { ScrollableTaskContainer } from '@/components/reports/ScrollableTaskContainer';
import { TaskDetailModal } from '@/components/reports/TaskDetailModal';
import { MetricsCard } from '@/components/reports/MetricsCard';
import { DailyTaskDetail, DailyDetailData as DailyDetailViewData } from '@/components/reports/weekly/DailyTaskDetailView';
import type { ReportFilter } from '@/types/reports';
import { toast } from 'sonner';

interface DailyCompletionTabProps {
  filter: ReportFilter;
  onDateChange?: (date: Date) => void;
}

export const DailyCompletionTab: React.FC<DailyCompletionTabProps> = ({
  filter,
  onDateChange
}) => {
  const [selectedTask, setSelectedTask] = useState<DailyTaskDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dailyDetailData, setDailyDetailData] = useState<DailyDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Use unified daily report hook with both metrics and task lists
  const { metrics: dailyMetrics, buckets, isLoading: metricsLoading, error } = useDailyReport(filter);
  
  // Legacy hook for detailed task lists (backward compatibility)
  const { getDailyTaskDetails } = useTaskReports({
    timeRange: 'custom',
    userId: filter.userId,
    teamId: filter.teamIds?.[0],
  });

  // Load data when date or user changes
  React.useEffect(() => {
    const loadDailyData = async () => {
      if (!filter.dateISO) return;
      
      setDetailLoading(true);
      setDailyDetailData(null);
      
      try {
        const details = await getDailyTaskDetails(filter.dateISO);
        setDailyDetailData(details);
      } catch (error) {
        console.error('Failed to load daily details:', error);
        toast.error('Failed to load daily task details');
      } finally {
        setDetailLoading(false);
      }
    };

    loadDailyData();
  }, [filter.dateISO, filter.userId, filter.teamIds]);

  // Safe date handling with validation
  const selectedDate = React.useMemo(() => {
    if (!filter.dateISO) return new Date();
    try {
      const date = parseISO(filter.dateISO);
      return isValid(date) ? date : new Date();
    } catch {
      return new Date();
    }
  }, [filter.dateISO]);

  const userName = filter.userId ? 'Selected User' : 'All Users';

  // Don't render if filter is not ready (only when org is missing)
  if (!filter.orgId) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleTaskClick = (task: DailyTaskDetail) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };
  if (metricsLoading || detailLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Daily Task Report</h2>
          <p className="text-muted-foreground">
            {userName} • {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        {onDateChange && (
          <DateNavigation
            selectedDate={selectedDate}
            onDateChange={onDateChange}
          />
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricsCard
          title="Completed"
          value={dailyMetrics?.completed || 0}
          icon={<CheckCircle className="h-5 w-5 text-white" />}
          colorClass="bg-success text-success-foreground ring-1 ring-emerald-400/30 shadow-emerald-400/10"
          trend={{ value: 5, label: "+12% from yesterday" }}
        />
        <MetricsCard
          title="Created"
          value={dailyMetrics?.created || 0}
          icon={<Plus className="h-5 w-5 text-white" />}
          colorClass="bg-primary text-primary-foreground ring-1 ring-primary/30 shadow-primary/10"
        />
        <MetricsCard
          title="Assigned"
          value={dailyMetrics?.assigned || 0}
          icon={<UserPlus className="h-5 w-5 text-white" />}
          colorClass="bg-purple-500 text-white ring-1 ring-purple-400/35 shadow-purple-400/15"
        />
        <MetricsCard
          title="Overdue"
          value={dailyMetrics?.overdue || 0}
          icon={<AlertTriangle className="h-5 w-5 text-white" />}
          colorClass="bg-warning text-warning-foreground ring-1 ring-red-400/35 shadow-red-400/15"
        />
        <MetricsCard
          title="Daily Score"
          value={`${Math.round(dailyMetrics?.daily_score || 0)}%`}
          icon={<TrendingUp className="h-5 w-5 text-white" />}
          colorClass="bg-info text-info-foreground ring-1 ring-info/30 shadow-info/10 hover:shadow-info/20"
          trend={{ value: 8, label: "+8% this week" }}
        />
      </div>

      {/* Task Containers - Grid of 4 equal containers */}
      <div className="grid grid-cols-2 gap-4">
        <ScrollableTaskContainer
          title="Due Today"
          tasks={buckets?.due_today?.map(task => ({
            task_id: task.task_id,
            title: task.title,
            description: '',
            priority: task.priority as 'High' | 'Medium' | 'Low',
            status: task.status as 'To Do' | 'In Progress' | 'Completed' | 'Archived',
            deadline: task.due_at,
            created_at: task.created_at,
            completed_at: task.completed_at,
            project_title: null
          })) || []}
          icon={<AlertTriangle className="h-4 w-4 text-warning" />}
          onTaskClick={handleTaskClick}
          emptyMessage="No tasks due today"
          maxHeight="420px"
          className="ring-1 ring-amber-400/35 shadow-amber-400/15"
        />
        
        <ScrollableTaskContainer
          title="Overdue"
          tasks={buckets?.overdue?.map(task => ({
            task_id: task.task_id,
            title: task.title,
            description: '',
            priority: task.priority as 'High' | 'Medium' | 'Low',
            status: task.status as 'To Do' | 'In Progress' | 'Completed' | 'Archived',
            deadline: task.due_at,
            created_at: task.created_at,
            completed_at: task.completed_at,
            project_title: null
          })) || []}
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          onTaskClick={handleTaskClick}
          emptyMessage="No overdue tasks"
          maxHeight="420px"
          className="ring-1 ring-red-400/35 shadow-red-400/15"
        />
        
        <ScrollableTaskContainer
          title="Completed Today"
          tasks={buckets?.completed_today?.map(task => ({
            task_id: task.task_id,
            title: task.title,
            description: '',
            priority: task.priority as 'High' | 'Medium' | 'Low',
            status: task.status as 'To Do' | 'In Progress' | 'Completed' | 'Archived',
            deadline: task.due_at,
            created_at: task.created_at,
            completed_at: task.completed_at,
            project_title: null
          })) || []}
          icon={<CheckCircle className="h-4 w-4 text-success" />}
          onTaskClick={handleTaskClick}
          emptyMessage="No tasks completed today"
          maxHeight="420px"
          className="ring-1 ring-emerald-400/30 shadow-emerald-400/10"
        />

        <ScrollableTaskContainer
          title="Assigned Today"
          tasks={buckets?.assigned_today?.map(task => ({
            task_id: task.task_id,
            title: task.title,
            description: '',
            priority: task.priority as 'High' | 'Medium' | 'Low',
            status: task.status as 'To Do' | 'In Progress' | 'Completed' | 'Archived',
            deadline: task.due_at,
            created_at: task.created_at,
            completed_at: task.completed_at,
            project_title: null
          })) || []}
          icon={<UserPlus className="h-4 w-4 text-purple-500" />}
          onTaskClick={handleTaskClick}
          emptyMessage="No tasks assigned today"
          maxHeight="420px"
          className="ring-1 ring-slate-200/60 hover:shadow-slate-300/20"
        />
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};