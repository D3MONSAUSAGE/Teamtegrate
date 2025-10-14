import { useState } from 'react';
import { toast } from 'sonner';
import { downloadCSV } from '@/utils/exportUtils';
import { 
  exportDailyReport, 
  exportWeeklyReport, 
  exportPerformanceReport 
} from '@/utils/taskReportExportUtils';
import type { ReportFilter } from '@/types/reports';

export interface UseTaskReportExportProps {
  filter: ReportFilter;
  teamName?: string;
  userName?: string;
}

export const useTaskReportExport = ({ filter, teamName, userName }: UseTaskReportExportProps) => {
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Export daily report data
   */
  const exportDaily = async (metrics: any, buckets: any) => {
    setIsExporting(true);
    try {
      const exportData = exportDailyReport(metrics, buckets, filter, teamName, userName);
      downloadCSV(exportData);
      toast.success('Daily report exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export daily report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export weekly report data
   */
  const exportWeekly = async (weeklyData: any[]) => {
    setIsExporting(true);
    try {
      const exportData = exportWeeklyReport(weeklyData, filter, teamName, userName);
      downloadCSV(exportData);
      toast.success('Weekly report exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export weekly report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export performance report data
   */
  const exportPerformance = async (performanceData: any[]) => {
    setIsExporting(true);
    try {
      const exportData = exportPerformanceReport(performanceData, filter, teamName, userName);
      downloadCSV(exportData);
      toast.success('Performance report exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export performance report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportDaily,
    exportWeekly,
    exportPerformance,
    isExporting
  };
};
