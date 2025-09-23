import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Download, 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Users, 
  Target,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useComprehensiveReports, ReportGranularity } from '@/hooks/useComprehensiveReports';
import { useTaskReports } from '@/hooks/useTaskReports';
import { useWeeklyReport } from '@/hooks/useTaskReports';
import { DailyCompletionChart } from '@/components/reports/weekly/DailyCompletionChart';
import { DailyTaskDetailView, DailyDetailData } from '@/components/reports/weekly/DailyTaskDetailView';
import { WeekNavigation } from '@/components/reports/WeekNavigation';
import { MetricsCard } from '@/components/reports/MetricsCard';
import { downloadCSV } from '@/utils/exportUtils';
import type { ReportFilter } from '@/types/reports';
import { toast } from 'sonner';

interface WeeklyOverviewTabProps {
  filter: ReportFilter;
}

export const WeeklyOverviewTab: React.FC<WeeklyOverviewTabProps> = ({
  filter,
}) => {
  const [granularity, setGranularity] = useState<ReportGranularity>('daily');
  const [exportType, setExportType] = useState<'daily' | 'weekly' | 'comprehensive'>('comprehensive');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dailyDetailData, setDailyDetailData] = useState<DailyDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());

  // Use new centralized weekly report hook
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyReport(filter);

  // Fallback to comprehensive reports for additional data (backward compatibility)
  const userId = filter.userId || '';
  const userName = filter.userId ? 'Selected User' : 'All Users';
  const timeRange = '7 days'; // Default for backward compatibility
  const dateRange: DateRange | undefined = filter.dateISO ? {
    from: new Date(filter.dateISO),
    to: new Date(filter.dateISO)
  } : undefined;

  const {
    comprehensiveData,
    dailyCompletionData,
    summary,
    isLoading: comprehensiveLoading,
    error,
    range,
  } = useComprehensiveReports({
    userId,
    timeRange,
    dateRange,
    granularity,
  });

  // Get the task reports hook for daily details (legacy)
  const { getDailyTaskDetails } = useTaskReports({
    timeRange,
    dateRange,
    userId,
  });

  const isLoading = weeklyLoading || comprehensiveLoading;

  const handleDayClick = React.useCallback(async (date: string) => {
    setSelectedDate(date);
    setDetailLoading(true);
    setDailyDetailData(null);
    
    try {
      const details = await getDailyTaskDetails(date);
      setDailyDetailData(details);
    } catch (error) {
      console.error('Failed to load daily details:', error);
      toast.error('Failed to load daily task details');
    } finally {
      setDetailLoading(false);
    }
  }, [getDailyTaskDetails]); // Keep getDailyTaskDetails as dependency since it's stable now

  // Prepare data for charts
  const chartData = React.useMemo(() => {
    return dailyCompletionData.map(item => ({
      day: format(new Date(item.completion_date), 'EEE'),
      date: item.completion_date,
      completed: item.completed_tasks,
      pending: item.pending_tasks,
      total: item.total_tasks,
      totalHours: Math.round((item.total_time_minutes / 60) * 100) / 100,
    }));
  }, [dailyCompletionData]);

  const handleExport = async () => {
    try {
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const userStr = userName.toLowerCase().replace(/\s+/g, '-');
      const timeStr = timeRange === '7 days' ? 'weekly' : timeRange === '30 days' ? 'monthly' : 'custom';

      let exportData;
      
      if (exportType === 'comprehensive') {
        // Export comprehensive data with all metrics
        const rows = [
          ['Report Information', '', '', ''],
          ['User Name', userName, '', ''],
          ['Date Range', `${range.startDate} to ${range.endDate}`, '', ''],
          ['Granularity', granularity, '', ''],
          ['Generated At', format(new Date(), 'yyyy-MM-dd HH:mm:ss'), '', ''],
          ['', '', '', ''],
          ['Summary Metrics', '', '', ''],
          ['Total Tasks', summary.total_tasks.toString(), '', ''],
          ['Completed Tasks', summary.completed_tasks.toString(), '', ''],
          ['Completion Rate', `${summary.completion_rate}%`, '', ''],
          ['Total Hours Worked', summary.total_hours.toString(), '', ''],
          ['Productivity Score', summary.avg_productivity_score.toString(), '', ''],
          ['Efficiency Rating', summary.avg_efficiency_rating.toString(), '', ''],
          ['Active Projects', summary.total_projects.toString(), '', ''],
          ['', '', '', ''],
          ['Detailed Breakdown', '', '', ''],
          ['Period', 'Tasks', 'Completion Rate', 'Hours Worked'],
          ...comprehensiveData.map(item => [
            item.period_label,
            `${item.completed_tasks}/${item.total_tasks}`,
            `${item.completion_rate}%`,
            Math.round((item.total_minutes_worked / 60) * 100) / 100,
          ]),
        ];

        exportData = {
          filename: `${userStr}-comprehensive-report-${timeStr}-${dateStr}.csv`,
          headers: ['Category', 'Value', 'Additional Info', 'Notes'],
          rows,
          metadata: {
            exportType: 'comprehensive-report',
            dateRange: `${range.startDate} to ${range.endDate}`,
            granularity,
            user: userName,
            generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            totalRecords: comprehensiveData.length,
          },
        };
      } else if (exportType === 'daily') {
        // Export daily task completion data
        const rows = [
          ['Date', 'Day', 'Total Tasks', 'Completed', 'Pending', 'Overdue', 'Completion Rate', 'Hours Worked', 'Avg Time/Task'],
          ...dailyCompletionData.map(item => [
            item.completion_date,
            item.day_name,
            item.total_tasks.toString(),
            item.completed_tasks.toString(),
            item.pending_tasks.toString(),
            item.overdue_tasks.toString(),
            `${item.completion_rate}%`,
            Math.round((item.total_time_minutes / 60) * 100) / 100,
            Math.round(item.avg_time_per_task),
          ]),
        ];

        exportData = {
          filename: `${userStr}-daily-completion-${timeStr}-${dateStr}.csv`,
          headers: rows[0],
          rows: rows.slice(1),
          metadata: {
            exportType: 'daily-completion',
            dateRange: `${range.startDate} to ${range.endDate}`,
            user: userName,
            generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            totalRecords: dailyCompletionData.length,
          },
        };
      } else {
        // Export weekly aggregated data
        const weeklyRows = comprehensiveData.map(item => [
          item.period_label,
          item.total_tasks.toString(),
          item.completed_tasks.toString(),
          `${item.completion_rate}%`,
          Math.round((item.total_minutes_worked / 60) * 100) / 100,
          item.productivity_score.toString(),
          item.efficiency_rating.toString(),
          item.projects_data.length.toString(),
        ]);

        exportData = {
          filename: `${userStr}-weekly-performance-${timeStr}-${dateStr}.csv`,
          headers: ['Period', 'Total Tasks', 'Completed', 'Completion Rate', 'Hours', 'Productivity', 'Efficiency', 'Projects'],
          rows: weeklyRows,
          metadata: {
            exportType: 'weekly-performance',
            dateRange: `${range.startDate} to ${range.endDate}`,
            user: userName,
            generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            totalRecords: weeklyRows.length,
          },
        };
      }

      downloadCSV(exportData);
      toast.success(`${exportType} report exported successfully!`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report. Please try again.');
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Failed to load weekly reports: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Weekly Overview Report
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {userName} • {range.startDate} to {range.endDate}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <WeekNavigation
                selectedWeek={selectedWeek}
                onWeekChange={setSelectedWeek}
              />
              
              <Select value={granularity} onValueChange={(value: ReportGranularity) => setGranularity(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={exportType} onValueChange={(value: 'daily' | 'weekly' | 'comprehensive') => setExportType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
                  <SelectItem value="daily">Daily Tasks</SelectItem>
                  <SelectItem value="weekly">Weekly Summary</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Tasks Completed"
          value={summary.completed_tasks}
          icon={<Target className="h-5 w-5 text-white" />}
          colorClass="bg-success text-success-foreground"
          trend={{ value: 12, label: "of " + summary.total_tasks + " total" }}
        />

        <MetricsCard
          title="Completion Rate"
          value={`${summary.completion_rate}%`}
          icon={<TrendingUp className="h-5 w-5 text-white" />}
          colorClass="bg-primary text-primary-foreground"
          trend={{ value: summary.completion_rate >= 80 ? 8 : -2, label: summary.completion_rate >= 80 ? 'Excellent' : 'Good' }}
        />

        <MetricsCard
          title="Hours Worked"
          value={`${summary.total_hours}h`}
          icon={<Clock className="h-5 w-5 text-white" />}
          colorClass="bg-info text-info-foreground"
          trend={{ value: 5, label: `Avg ${Math.round((summary.total_hours / Math.max(dailyCompletionData.length, 1)) * 100) / 100}h/day` }}
        />

        <MetricsCard
          title="Active Projects"
          value={summary.total_projects}
          icon={<Users className="h-5 w-5 text-white" />}
          colorClass="bg-purple-500 text-white"
          trend={{ value: 0, label: `Score: ${summary.avg_productivity_score}` }}
        />
      </div>

      {/* Weekly Charts */}
      <div className="space-y-6">
        <DailyCompletionChart 
          data={chartData} 
          isLoading={isLoading}
          onDayClick={handleDayClick}
          selectedDate={selectedDate}
        />
        
        {selectedDate && (
          <DailyTaskDetailView 
            data={dailyDetailData}
            isLoading={detailLoading}
            selectedDate={selectedDate}
          />
        )}
      </div>

      {/* Performance Metrics Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {comprehensiveData.map((period, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{period.period_label}</h4>
                    <p className="text-sm text-muted-foreground">
                      {period.completed_tasks}/{period.total_tasks} tasks • {Math.round((period.total_minutes_worked / 60) * 100) / 100}h worked
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {period.completion_rate}% completion
                    </Badge>
                    <Badge variant="secondary">
                      Score: {period.productivity_score}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};