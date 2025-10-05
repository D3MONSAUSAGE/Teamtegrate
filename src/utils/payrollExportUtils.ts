import { format, parseISO } from 'date-fns';

export interface TimeEntryForExport {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  approval_status: string;
  approved_by: string | null;
  approved_at: string | null;
  approval_notes: string | null;
  labor_cost: number | null;
  notes: string | null;
  team_id: string | null;
  // Joined user data
  user?: {
    name: string;
    email: string;
    employee_id: string | null;
    hourly_rate: number | null;
  };
  // Joined approver data
  approver?: {
    name: string;
  };
  // Joined team data
  team?: {
    name: string;
  };
}

interface PayrollExportRow {
  'Employee Name': string;
  'Employee ID': string;
  'Email': string;
  'Team': string;
  'Date': string;
  'Clock In': string;
  'Clock Out': string;
  'Total Hours': string;
  'Regular Hours': string;
  'Overtime Hours': string;
  'Break Time (mins)': string;
  'Hourly Rate': string;
  'Regular Pay': string;
  'Overtime Pay': string;
  'Total Pay': string;
  'Approval Status': string;
  'Approved By': string;
  'Approved Date': string;
  'Approval Notes': string;
  'Employee Notes': string;
}

const REGULAR_HOURS_PER_DAY = 8;
const OVERTIME_MULTIPLIER = 1.5;

/**
 * Calculate regular and overtime hours
 */
const calculatePayBreakdown = (totalMinutes: number, hourlyRate: number) => {
  const totalHours = totalMinutes / 60;
  const regularHours = Math.min(totalHours, REGULAR_HOURS_PER_DAY);
  const overtimeHours = Math.max(0, totalHours - REGULAR_HOURS_PER_DAY);
  
  const regularPay = regularHours * hourlyRate;
  const overtimePay = overtimeHours * hourlyRate * OVERTIME_MULTIPLIER;
  const totalPay = regularPay + overtimePay;

  return {
    totalHours: totalHours.toFixed(2),
    regularHours: regularHours.toFixed(2),
    overtimeHours: overtimeHours.toFixed(2),
    regularPay: regularPay.toFixed(2),
    overtimePay: overtimePay.toFixed(2),
    totalPay: totalPay.toFixed(2),
  };
};

/**
 * Convert time entry to payroll CSV row
 */
const convertToPayrollRow = (entry: TimeEntryForExport): PayrollExportRow => {
  const userName = entry.user?.name || 'Unknown';
  const employeeId = entry.user?.employee_id || '';
  const email = entry.user?.email || '';
  const teamName = entry.team?.name || 'Unassigned';
  const hourlyRate = entry.user?.hourly_rate || 0;

  // Format dates and times
  const clockInDate = parseISO(entry.clock_in);
  const dateStr = format(clockInDate, 'yyyy-MM-dd');
  const clockInTime = format(clockInDate, 'HH:mm:ss');
  const clockOutTime = entry.clock_out ? format(parseISO(entry.clock_out), 'HH:mm:ss') : 'N/A';

  // Calculate hours and pay
  const totalMinutes = entry.duration_minutes || 0;
  const breakdown = calculatePayBreakdown(totalMinutes, hourlyRate);

  // Approval details
  const approvalStatus = entry.approval_status || 'pending';
  const approvedBy = entry.approver?.name || '';
  const approvedDate = entry.approved_at ? format(parseISO(entry.approved_at), 'yyyy-MM-dd HH:mm') : '';

  return {
    'Employee Name': userName,
    'Employee ID': employeeId,
    'Email': email,
    'Team': teamName,
    'Date': dateStr,
    'Clock In': clockInTime,
    'Clock Out': clockOutTime,
    'Total Hours': breakdown.totalHours,
    'Regular Hours': breakdown.regularHours,
    'Overtime Hours': breakdown.overtimeHours,
    'Break Time (mins)': '0', // TODO: Add break tracking if needed
    'Hourly Rate': hourlyRate.toFixed(2),
    'Regular Pay': breakdown.regularPay,
    'Overtime Pay': breakdown.overtimePay,
    'Total Pay': breakdown.totalPay,
    'Approval Status': approvalStatus.toUpperCase(),
    'Approved By': approvedBy,
    'Approved Date': approvedDate,
    'Approval Notes': entry.approval_notes || '',
    'Employee Notes': entry.notes || '',
  };
};

/**
 * Escape CSV cell value
 */
const escapeCsvCell = (value: string): string => {
  const stringValue = value.toString();
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

/**
 * Convert payroll rows to CSV string
 */
const convertToCSV = (rows: PayrollExportRow[]): string => {
  if (rows.length === 0) return '';

  // Get headers
  const headers = Object.keys(rows[0]);
  
  // Create CSV rows
  const csvRows = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map(row =>
      headers.map(header => escapeCsvCell(row[header as keyof PayrollExportRow])).join(',')
    ),
  ];

  return csvRows.join('\n');
};

/**
 * Download CSV file
 */
const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Main export function
 */
export const exportTimeEntriesToPayroll = (
  entries: TimeEntryForExport[],
  filename?: string
): void => {
  try {
    // Convert entries to payroll rows
    const payrollRows = entries.map(convertToPayrollRow);

    // Generate CSV
    const csvContent = convertToCSV(payrollRows);

    // Generate filename
    const defaultFilename = `payroll_export_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
    
    // Download
    downloadCSV(csvContent, filename || defaultFilename);
  } catch (error) {
    console.error('Payroll export failed:', error);
    throw new Error('Failed to export payroll data. Please try again.');
  }
};

/**
 * Export summary statistics
 */
export const generateExportSummary = (entries: TimeEntryForExport[]) => {
  const totalEntries = entries.length;
  const approvedEntries = entries.filter(e => e.approval_status === 'approved').length;
  const pendingEntries = entries.filter(e => e.approval_status === 'pending').length;
  const rejectedEntries = entries.filter(e => e.approval_status === 'rejected').length;

  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  const totalHours = totalMinutes / 60;
  const regularHours = Math.min(totalHours, totalEntries * REGULAR_HOURS_PER_DAY);
  const overtimeHours = Math.max(0, totalHours - regularHours);

  const totalLaborCost = entries.reduce((sum, e) => sum + (e.labor_cost || 0), 0);

  return {
    totalEntries,
    approvedEntries,
    pendingEntries,
    rejectedEntries,
    totalHours: totalHours.toFixed(2),
    regularHours: regularHours.toFixed(2),
    overtimeHours: overtimeHours.toFixed(2),
    totalLaborCost: totalLaborCost.toFixed(2),
  };
};
