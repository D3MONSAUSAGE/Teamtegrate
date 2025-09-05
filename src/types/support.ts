export interface BugReport {
  id: string;
  user_id: string;
  organization_id: string;
  title: string;
  description: string;
  category: BugCategory;
  priority: BugPriority;
  steps_to_reproduce?: string;
  expected_behavior?: string;
  actual_behavior?: string;
  system_info?: SystemInfo;
  status: BugStatus;
  created_at: string;
  updated_at: string;
}

export type BugCategory = 'ui_ux' | 'performance' | 'data_issues' | 'authentication' | 'other';

export type BugPriority = 'low' | 'medium' | 'high' | 'critical';

export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SystemInfo {
  [key: string]: string | undefined;
  browser?: string;
  os?: string;
  screen_resolution?: string;
  user_agent?: string;
  current_page?: string;
  timestamp?: string;
}

export interface BugReportFormData {
  title: string;
  description: string;
  category: BugCategory;
  priority: BugPriority;
  steps_to_reproduce?: string;
  expected_behavior?: string;
  actual_behavior?: string;
}

export const bugCategoryLabels: Record<BugCategory, string> = {
  ui_ux: 'UI/UX Issues',
  performance: 'Performance',
  data_issues: 'Data Issues',
  authentication: 'Authentication',
  other: 'Other',
};

export const bugPriorityLabels: Record<BugPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};