import React, { useState } from 'react';
import { CheckCircle, Plus, UserPlus, AlertTriangle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
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

  // Use centralized daily report hook
  const { data: dailyMetrics, isLoading: metricsLoading, error } = useDailyReport(filter);
  
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

  const selectedDate = new Date(filter.dateISO);
  const userName = filter.userId ? 'Selected User' : 'All Users';

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
          colorClass="bg-success text-success-foreground"
          trend={{ value: 5, label: "+12% from yesterday" }}
        />
        <MetricsCard
          title="Created"
          value={dailyMetrics?.created || 0}
          icon={<Plus className="h-5 w-5 text-white" />}
          colorClass="bg-primary text-primary-foreground"
        />
        <MetricsCard
          title="Assigned"
          value={dailyMetrics?.assigned || 0}
          icon={<UserPlus className="h-5 w-5 text-white" />}
          colorClass="bg-purple-500 text-white"
        />
        <MetricsCard
          title="Overdue"
          value={dailyMetrics?.overdue || 0}
          icon={<AlertTriangle className="h-5 w-5 text-white" />}
          colorClass="bg-warning text-warning-foreground"
        />
        <MetricsCard
          title="Daily Score"
          value={`${Math.round(dailyMetrics?.daily_score || 0)}%`}
          icon={<TrendingUp className="h-5 w-5 text-white" />}
          colorClass="bg-info text-info-foreground"
          trend={{ value: 8, label: "+8% this week" }}
        />
      </div>

      {/* Task Containers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ScrollableTaskContainer
          title="Current Tasks"
          tasks={dailyDetailData?.pending_tasks || []}
          icon={<AlertTriangle className="h-4 w-4 text-warning" />}
          onTaskClick={handleTaskClick}
          emptyMessage="No pending tasks for today"
          maxHeight="400px"
        />
        
        <ScrollableTaskContainer
          title="Overdue Tasks"
          tasks={dailyDetailData?.overdue_tasks || []}
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          onTaskClick={handleTaskClick}
          emptyMessage="No overdue tasks"
          maxHeight="400px"
        />
        
        <ScrollableTaskContainer
          title="Completed Tasks"
          tasks={dailyDetailData?.completed_tasks || []}
          icon={<CheckCircle className="h-4 w-4 text-success" />}
          onTaskClick={handleTaskClick}
          emptyMessage="No completed tasks today"
          maxHeight="400px"
        />
      </div>

      {/* Additional Task Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScrollableTaskContainer
          title="Tasks Created Today"
          tasks={dailyDetailData?.created_tasks || []}
          icon={<Plus className="h-4 w-4 text-primary" />}
          onTaskClick={handleTaskClick}
          emptyMessage="No tasks created today"
          maxHeight="400px"
        />
        
        <ScrollableTaskContainer
          title="Tasks Assigned Today"
          tasks={dailyDetailData?.assigned_tasks || []}
          icon={<UserPlus className="h-4 w-4 text-purple-500" />}
          onTaskClick={handleTaskClick}
          emptyMessage="No tasks assigned today"
          maxHeight="400px"
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