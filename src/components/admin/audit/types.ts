
export interface AuditResult {
  section: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export interface AuditContext {
  user: any;
  isAuthenticated: boolean;
}
