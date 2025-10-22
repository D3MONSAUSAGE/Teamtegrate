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
  temporary_password: string;
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
  updated_at: string;
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

export const DEFAULT_TIME_OFF_ALLOCATIONS = {
  vacation: 80, // 2 weeks
  sick: 40, // 5 days
  personal: 16, // 2 days
};
