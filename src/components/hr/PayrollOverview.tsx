import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { User } from '@/types';

interface PayrollOverviewProps {
  employees: User[];
}

const PayrollOverview: React.FC<PayrollOverviewProps> = ({ employees }) => {
  const payrollStats = useMemo(() => {
    const totalEmployees = employees.length;
    
    // Calculate average hourly rate
    const rates = employees.map((emp: any) => emp.hourly_rate || 15);
    const avgRate = rates.length > 0 
      ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length 
      : 15;

    // Calculate total hourly cost (if all employees worked 1 hour)
    const totalHourlyCost = rates.reduce((sum, rate) => sum + rate, 0);

    // Count employees by pay type
    const byPayType = employees.reduce((acc: any, emp: any) => {
      const type = emp.salary_type || 'hourly';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Count employees with default rate (needs attention)
    const defaultRateCount = employees.filter((emp: any) => 
      !emp.hourly_rate || emp.hourly_rate === 15
    ).length;

    return {
      totalEmployees,
      avgRate,
      totalHourlyCost,
      byPayType,
      defaultRateCount,
    };
  }, [employees]);

  return (
    <div className="space-y-6">
      {/* Alert for employees needing rate updates */}
      {payrollStats.defaultRateCount > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-900 dark:text-amber-100">
                Action Required: {payrollStats.defaultRateCount} employee(s) using default rate
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                These employees are using the default $15/hour rate. Update their hourly rates for accurate payroll calculations.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrollStats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Hourly Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${payrollStats.avgRate.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per hour across all employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hourly Labor Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${payrollStats.totalHourlyCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total cost per hour (all staff)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Weekly</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(payrollStats.totalHourlyCost * 40).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on 40hr/week avg
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Pay Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Compensation Type Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(payrollStats.byPayType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {type}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {count as number} employee{(count as number) !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-sm font-medium">
                  {((count as number / payrollStats.totalEmployees) * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Payroll Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Update hourly rates regularly to ensure accurate payroll calculations</p>
          <p>• Time tracking data automatically uses these rates for labor cost calculations</p>
          <p>• Review the Time Tracking page to see actual hours worked and labor costs</p>
          <p>• Set hire dates to track employee tenure and calculate benefits eligibility</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollOverview;
