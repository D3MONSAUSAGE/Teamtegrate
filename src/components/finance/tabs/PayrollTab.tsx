import React, { useState } from 'react';
import { startOfWeek } from 'date-fns';
import { WeekPicker } from '@/components/ui/week-picker';
import { useWeeklyPayrollData } from '@/hooks/useWeeklyPayrollData';
import { PayrollSummaryCards } from '../payroll/PayrollSummaryCards';
import { PayrollComparisonMetrics } from '../payroll/PayrollComparisonMetrics';
import { PayrollChart } from '../payroll/PayrollChart';
import { PayrollDailyBreakdown } from '../payroll/PayrollDailyBreakdown';
import { PayrollTeamBreakdown } from '../payroll/PayrollTeamBreakdown';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PayrollTab() {
  const [selectedWeek, setSelectedWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  const { data, isLoading, error } = useWeeklyPayrollData(selectedWeek);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load payroll data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>
          No payroll data available for the selected week.
        </AlertDescription>
      </Alert>
    );
  }

  const { summary, comparison } = data;

  return (
    <div className="space-y-6">
      {/* Week Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payroll Analysis</h2>
          <p className="text-muted-foreground">
            Weekly payroll costs compared to sales performance
          </p>
        </div>
        <WeekPicker
          selectedWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
        />
      </div>

      {/* Summary Cards */}
      <PayrollSummaryCards summary={summary} />

      {/* Comparison Metrics */}
      <PayrollComparisonMetrics comparison={comparison} />

      {/* Chart */}
      <PayrollChart dailyData={summary.dailyData} />

      {/* Daily Breakdown */}
      <PayrollDailyBreakdown dailyData={summary.dailyData} />

      {/* Team Breakdown */}
      <PayrollTeamBreakdown teamData={summary.teamData} />
    </div>
  );
}
