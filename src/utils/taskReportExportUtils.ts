import { format } from 'date-fns';
import type { ReportFilter } from '@/types/reports';

export interface ExportMetadata {
  exportType: string;
  dateRange: string;
  filters: string;
  generatedAt: string;
  totalRecords: number;
}

export interface ExportData {
  filename: string;
  headers: string[];
  rows: string[][];
  metadata: ExportMetadata;
}

/**
 * Generate metadata for export
 */
export const generateExportMetadata = (
  exportType: string,
  filter: ReportFilter,
  totalRecords: number,
  teamName?: string,
  userName?: string
): ExportMetadata => {
  const filters = [];
  if (teamName) filters.push(`Team: ${teamName}`);
  if (userName) filters.push(`User: ${userName}`);
  if (!teamName && !userName) filters.push('All teams/users');

  return {
    exportType,
    dateRange: filter.view === 'daily' 
      ? `Date: ${filter.dateISO}` 
      : `Week: ${filter.weekStartISO}`,
    filters: filters.join(', '),
    generatedAt: new Date().toISOString(),
    totalRecords
  };
};

/**
 * Generate filename with timestamp and filters
 */
export const generateFilename = (
  prefix: string,
  filter: ReportFilter,
  teamName?: string,
  userName?: string
): string => {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
  const parts = [prefix, filter.dateISO || filter.weekStartISO, timestamp];
  
  if (userName) {
    parts.push(userName.replace(/\s+/g, '_'));
  } else if (teamName) {
    parts.push(teamName.replace(/\s+/g, '_'));
  }
  
  return `${parts.join('_')}.csv`;
};

/**
 * Export daily report data to CSV format
 */
export const exportDailyReport = (
  metrics: any,
  buckets: any,
  filter: ReportFilter,
  teamName?: string,
  userName?: string
): ExportData => {
  const headers = ['Metric', 'Value'];
  const rows: string[][] = [];

  // Add summary metrics
  rows.push(['Due Today', metrics.current_due.toString()]);
  rows.push(['Completed Today', metrics.completed.toString()]);
  rows.push(['Overdue', metrics.overdue.toString()]);
  rows.push(['Created Today', metrics.created.toString()]);
  rows.push(['Assigned Today', metrics.assigned.toString()]);
  rows.push(['Daily Score', `${metrics.daily_score}%`]);
  rows.push(['']); // Empty row separator

  // Add task details header
  rows.push(['Task Details', '', '', '', '']);
  rows.push(['Task ID', 'Title', 'Priority', 'Status', 'Deadline']);

  // Add tasks from each bucket
  const addBucketTasks = (bucket: any[], bucketName: string) => {
    if (bucket.length > 0) {
      rows.push(['']); // Separator
      rows.push([`--- ${bucketName} ---`, '', '', '', '']);
      bucket.forEach(task => {
        rows.push([
          task.task_id || '',
          task.title || '',
          task.priority || '',
          task.status || '',
          task.due_at ? format(new Date(task.due_at), 'yyyy-MM-dd HH:mm') : ''
        ]);
      });
    }
  };

  addBucketTasks(buckets.due_today, 'Due Today');
  addBucketTasks(buckets.completed_today, 'Completed Today');
  addBucketTasks(buckets.overdue, 'Overdue');
  addBucketTasks(buckets.created_today, 'Created Today');
  addBucketTasks(buckets.assigned_today, 'Assigned Today');

  const totalRecords = Object.values(buckets).reduce((sum, bucket: any) => 
    sum + (bucket?.length || 0), 0 as number
  ) as number;

  return {
    filename: generateFilename('daily_report', filter, teamName, userName),
    headers,
    rows,
    metadata: generateExportMetadata('Daily Task Report', filter, totalRecords, teamName, userName)
  };
};

/**
 * Export weekly report data to CSV format
 */
export const exportWeeklyReport = (
  weeklyData: any[],
  filter: ReportFilter,
  teamName?: string,
  userName?: string
): ExportData => {
  const headers = ['Date', 'Due', 'Completed', 'Created', 'Assigned', 'Overdue', 'Daily Score'];
  const rows: string[][] = [];

  weeklyData.forEach(day => {
    rows.push([
      day.day_date || '',
      day.current_due?.toString() || '0',
      day.completed?.toString() || '0',
      day.created?.toString() || '0',
      day.assigned?.toString() || '0',
      day.overdue?.toString() || '0',
      `${day.daily_score || 0}%`
    ]);
  });

  // Add summary row
  rows.push(['']); // Separator
  rows.push(['Total', '', '', '', '', '', '']);
  rows.push([
    'Week Summary',
    weeklyData.reduce((sum, d) => sum + (Number(d.current_due) || 0), 0).toString(),
    weeklyData.reduce((sum, d) => sum + (Number(d.completed) || 0), 0).toString(),
    weeklyData.reduce((sum, d) => sum + (Number(d.created) || 0), 0).toString(),
    weeklyData.reduce((sum, d) => sum + (Number(d.assigned) || 0), 0).toString(),
    weeklyData.reduce((sum, d) => sum + (Number(d.overdue) || 0), 0).toString(),
    ''
  ]);

  return {
    filename: generateFilename('weekly_report', filter, teamName, userName),
    headers,
    rows,
    metadata: generateExportMetadata('Weekly Task Report', filter, weeklyData.length, teamName, userName)
  };
};

/**
 * Export performance data to CSV format
 */
export const exportPerformanceReport = (
  performanceData: any[],
  filter: ReportFilter,
  teamName?: string,
  userName?: string
): ExportData => {
  const headers = ['User/Team', 'Total Tasks', 'Completed', 'Completion Rate', 'Avg Time (hrs)', 'High Priority', 'Medium Priority', 'Low Priority'];
  const rows: string[][] = [];

  performanceData.forEach(item => {
    rows.push([
      item.name || item.user_name || 'Unknown',
      item.total_tasks?.toString() || '0',
      item.completed_tasks?.toString() || '0',
      item.completion_rate ? `${item.completion_rate}%` : '0%',
      item.avg_completion_time?.toString() || '0',
      item.high_priority_count?.toString() || '0',
      item.medium_priority_count?.toString() || '0',
      item.low_priority_count?.toString() || '0'
    ]);
  });

  return {
    filename: generateFilename('performance_report', filter, teamName, userName),
    headers,
    rows,
    metadata: generateExportMetadata('Performance Report', filter, performanceData.length, teamName, userName)
  };
};
