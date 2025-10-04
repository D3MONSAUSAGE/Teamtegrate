export interface DailyPayrollData {
  date: string;
  hours: number;
  laborCost: number;
  sales: number;
  laborPercentage: number;
  salesPerHour: number;
  avgHourlyRate: number;
}

export interface TeamPayrollData {
  teamId: string;
  teamName: string;
  hours: number;
  laborCost: number;
  sales: number;
  laborPercentage: number;
  salesPerHour: number;
  avgHourlyRate: number;
}

export interface WeeklyPayrollSummary {
  totalLaborCost: number;
  totalHours: number;
  totalSales: number;
  laborPercentage: number;
  salesPerLaborHour: number;
  avgHourlyRate: number;
  dailyData: DailyPayrollData[];
  teamData: TeamPayrollData[];
}

export interface PayrollComparison {
  laborCostChange: number;
  hoursChange: number;
  salesChange: number;
  laborPercentageChange: number;
  salesPerHourChange: number;
}
