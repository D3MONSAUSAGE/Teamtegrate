import { UserRole } from './index';

export interface EmployeeFormData {
  // Basic Info
  name: string;
  email: string;
  employee_number?: string;
  hire_date?: string;
  date_of_birth?: string;
  phone?: string;
  address?: string;
  start_date?: string;
  
  // Role & Access
  role: UserRole;
  temporary_password?: string; // Optional - only needed when creating via invite
  job_role_ids?: string[];
  
  // Team & Department
  department?: string;
  team_assignments: Array<{
    team_id: string;
    role: 'manager' | 'member';
  }>;
  manager_id?: string;
  
  // Compensation
  employment_status: string;
  salary_type: string;
  hourly_rate: number;
  
  // Time Off
  vacation_hours_annual: number;
  sick_hours_annual: number;
  personal_hours_annual: number;
  
  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

export interface TimeOffBalance {
  id: string;
  organization_id: string;
  user_id: string;
  leave_type: 'vacation' | 'sick' | 'personal' | 'unpaid';
  total_hours: number;
  used_hours: number;
  accrual_rate: number;
  year: number;
  created_at: string;
  updated_at?: string;
  
  // California compliance fields
  accrual_method?: 'frontload' | 'per_30_hours';
  waiting_period_days?: number;
  waiting_period_start_date?: string;
  can_use_after_date?: string;
  max_balance_cap?: number;
  is_california_compliant?: boolean;
  last_frontload_date?: string;
  carryover_from_previous_year?: number;
}

export interface TimeOffRequest {
  id: string;
  organization_id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  hours_requested: number;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface AccrualHistoryEntry {
  id: string;
  organization_id: string;
  user_id: string;
  balance_id: string;
  leave_type: string;
  transaction_type: 'frontload' | 'carryover' | 'manual_adjustment' | 'admin_grant';
  hours_change: number;
  hours_before: number;
  hours_after: number;
  reason?: string;
  created_by?: string;
  created_at: string;
}

// California sick leave specific constants
export const CALIFORNIA_SICK_LEAVE = {
  ANNUAL_FRONTLOAD: 40,
  MAX_BALANCE_CAP: 80,
  WAITING_PERIOD_DAYS: 90,
  HOURS_PER_30_WORKED: 1, // Alternative accrual method (not using for now)
};

export const DEFAULT_TIME_OFF_ALLOCATIONS = {
  vacation: 80, // 2 weeks
  sick: 40, // 5 days (California compliant)
  personal: 16, // 2 days
};
