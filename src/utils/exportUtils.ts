import { EnhancedExportData } from '@/hooks/useEnhancedExport';

export const downloadCSV = (exportData: EnhancedExportData): void => {
  try {
    // Create metadata header
    const metadataRows = [
      ['# Report Metadata'],
      ['# Export Type:', exportData.metadata.exportType],
      ['# Date Range:', exportData.metadata.dateRange],
      ['# Filters:', exportData.metadata.filters],
      ['# Generated At:', exportData.metadata.generatedAt],
      ['# Total Records:', exportData.metadata.totalRecords.toString()],
      [''], // Empty row separator
    ];

    // Combine metadata, headers, and data
    const allRows = [
      ...metadataRows,
      exportData.headers,
      ...exportData.rows
    ];

    // Convert to CSV format
    const csvContent = allRows.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const escaped = cell.toString().replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
          ? `"${escaped}"` 
          : escaped;
      }).join(',')
    ).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportData.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Failed to export data. Please try again.');
  }
};

export const getTimeRangeOptions = () => [
  { value: 'This Week', label: 'This Week' },
  { value: 'Last Week', label: 'Last Week' },
  { value: 'This Month', label: 'This Month' },
  { value: 'Last Month', label: 'Last Month' },
  { value: 'This Quarter', label: 'This Quarter' },
  { value: 'This Year', label: 'This Year' },
  { value: '7 days', label: 'Last 7 days' },
  { value: '30 days', label: 'Last 30 days' },
  { value: '90 days', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' }
];

export const getExportTypeOptions = () => [
  { value: 'overview', label: 'Overview Report', description: 'High-level metrics and summary statistics' },
  { value: 'detailed-tasks', label: 'Detailed Tasks Report', description: 'Complete task data with all fields and metadata' },
  { value: 'user-performance', label: 'User Performance Report', description: 'Individual team member performance metrics' },
  { value: 'project-breakdown', label: 'Project Breakdown Report', description: 'Project-focused data with task distributions' },
  { value: 'time-tracking', label: 'Time Tracking Report', description: 'Task duration and efficiency metrics' }
];