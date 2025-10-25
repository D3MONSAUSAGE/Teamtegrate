/**
 * Time Off Calculations and Utilities
 * Handles prorated calculations, accruals, and balance management
 */

import { differenceInDays, startOfYear, endOfYear, addDays } from 'date-fns';

export interface TimeOffAllocation {
  leave_type: string;
  total_hours: number;
  accrual_rate: number;
  accrual_method: 'frontload' | 'per_pay_period';
}

// California sick leave compliance constants
export const CALIFORNIA_SICK_LEAVE = {
  ANNUAL_FRONTLOAD_HOURS: 48, // 6 days
  MAX_BALANCE_CAP: 80, // 10 days
  WAITING_PERIOD_DAYS: 90,
  ACCRUAL_RATE_PER_HOUR: 1 / 30, // 1 hour per 30 worked
} as const;

// Default annual allocations
export const DEFAULT_ALLOCATIONS = {
  vacation: { hours: 80, accrual_rate: 3.08 }, // 10 days, ~3.08 hours per pay period
  sick: { hours: 48, accrual_rate: 0 }, // 6 days, frontloaded
  personal: { hours: 16, accrual_rate: 0.62 }, // 2 days, ~0.62 hours per pay period
} as const;

/**
 * Calculate prorated sick leave hours based on hire date for current year
 * California requires minimum 48 hours (6 days) annual frontload
 */
export function calculateProratedSickHours(hireDate: string): number {
  const hire = new Date(hireDate);
  const currentYear = new Date().getFullYear();
  const hireYear = hire.getFullYear();
  
  // If hired in previous years, give full annual amount
  if (hireYear < currentYear) {
    return CALIFORNIA_SICK_LEAVE.ANNUAL_FRONTLOAD_HOURS;
  }
  
  // If hired this year, prorate based on remaining days
  const yearStart = startOfYear(hire);
  const yearEnd = endOfYear(hire);
  const totalDays = differenceInDays(yearEnd, yearStart) + 1;
  const daysRemaining = differenceInDays(yearEnd, hire) + 1;
  
  const prorated = Math.ceil(
    (daysRemaining / totalDays) * CALIFORNIA_SICK_LEAVE.ANNUAL_FRONTLOAD_HOURS
  );
  
  // Ensure minimum of 24 hours (3 days) for mid-year hires
  return Math.max(24, prorated);
}

/**
 * Calculate prorated vacation hours based on hire date for current year
 */
export function calculateProratedVacationHours(hireDate: string, annualHours: number = 80): number {
  const hire = new Date(hireDate);
  const currentYear = new Date().getFullYear();
  const hireYear = hire.getFullYear();
  
  // If hired in previous years, give full annual amount
  if (hireYear < currentYear) {
    return annualHours;
  }
  
  // If hired this year, prorate based on remaining days
  const yearStart = startOfYear(hire);
  const yearEnd = endOfYear(hire);
  const totalDays = differenceInDays(yearEnd, yearStart) + 1;
  const daysRemaining = differenceInDays(yearEnd, hire) + 1;
  
  return Math.ceil((daysRemaining / totalDays) * annualHours);
}

/**
 * Calculate when sick leave can be used (after 90-day waiting period)
 */
export function calculateSickLeaveAvailableDate(hireDate: string): string {
  const hire = new Date(hireDate);
  return addDays(hire, CALIFORNIA_SICK_LEAVE.WAITING_PERIOD_DAYS).toISOString().split('T')[0];
}

/**
 * Calculate years of service for an employee
 */
export function calculateYearsOfService(hireDate: string): number {
  const hire = new Date(hireDate);
  const today = new Date();
  const years = differenceInDays(today, hire) / 365.25;
  return Math.floor(years);
}

/**
 * Determine vacation hours based on years of service
 * Can be customized based on company policy
 */
export function getVacationHoursByTenure(yearsOfService: number): number {
  if (yearsOfService >= 10) return 120; // 15 days
  if (yearsOfService >= 5) return 96; // 12 days
  if (yearsOfService >= 2) return 80; // 10 days
  return 80; // 10 days for new employees
}

/**
 * Generate initial time off balances for a new employee
 */
export function generateInitialBalances(
  organizationId: string,
  userId: string,
  hireDate: string,
  year: number = new Date().getFullYear()
): Array<{
  organization_id: string;
  user_id: string;
  leave_type: string;
  total_hours: number;
  used_hours: number;
  accrual_rate: number;
  year: number;
  accrual_method: 'frontload' | 'per_pay_period';
  waiting_period_days?: number;
  waiting_period_start_date?: string;
  can_use_after_date?: string;
  max_balance_cap?: number;
  is_california_compliant?: boolean;
}> {
  const yearsOfService = calculateYearsOfService(hireDate);
  const vacationHours = getVacationHoursByTenure(yearsOfService);
  const proratedVacation = calculateProratedVacationHours(hireDate, vacationHours);
  const proratedSick = calculateProratedSickHours(hireDate);
  const sickLeaveAvailableDate = calculateSickLeaveAvailableDate(hireDate);

  return [
    {
      organization_id: organizationId,
      user_id: userId,
      leave_type: 'vacation',
      total_hours: proratedVacation,
      used_hours: 0,
      accrual_rate: DEFAULT_ALLOCATIONS.vacation.accrual_rate,
      year,
      accrual_method: 'per_pay_period',
    },
    {
      organization_id: organizationId,
      user_id: userId,
      leave_type: 'sick',
      total_hours: proratedSick,
      used_hours: 0,
      accrual_rate: 0,
      year,
      accrual_method: 'frontload',
      waiting_period_days: CALIFORNIA_SICK_LEAVE.WAITING_PERIOD_DAYS,
      waiting_period_start_date: hireDate,
      can_use_after_date: sickLeaveAvailableDate,
      max_balance_cap: CALIFORNIA_SICK_LEAVE.MAX_BALANCE_CAP,
      is_california_compliant: true,
    },
    {
      organization_id: organizationId,
      user_id: userId,
      leave_type: 'personal',
      total_hours: DEFAULT_ALLOCATIONS.personal.hours,
      used_hours: 0,
      accrual_rate: DEFAULT_ALLOCATIONS.personal.accrual_rate,
      year,
      accrual_method: 'per_pay_period',
    },
  ];
}

/**
 * Validate if there are sufficient hours available for a time off request
 */
export function hasAvailableBalance(
  totalHours: number,
  usedHours: number,
  requestedHours: number
): { isValid: boolean; available: number; message?: string } {
  const available = totalHours - usedHours;
  
  if (requestedHours > available) {
    return {
      isValid: false,
      available,
      message: `Insufficient balance. Available: ${available}h, Requested: ${requestedHours}h`,
    };
  }
  
  return { isValid: true, available };
}
