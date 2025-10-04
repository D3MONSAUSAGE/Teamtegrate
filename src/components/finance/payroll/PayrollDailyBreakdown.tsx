import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { DailyPayrollData } from '@/types/payroll';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface PayrollDailyBreakdownProps {
  dailyData: DailyPayrollData[];
}

export const PayrollDailyBreakdown: React.FC<PayrollDailyBreakdownProps> = ({ dailyData }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getLaborPercentageIndicator = (percentage: number) => {
    if (percentage < 25) return <CheckCircle className="h-4 w-4 text-success" />;
    if (percentage < 35) return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <AlertCircle className="h-4 w-4 text-destructive" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right">Payroll</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Labor %</TableHead>
                <TableHead className="text-right">$/Hour</TableHead>
                <TableHead className="text-right">Avg Rate</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyData.map((day) => (
                <TableRow key={day.date}>
                  <TableCell className="font-medium">
                    {format(parseISO(day.date), 'EEE, MMM d')}
                  </TableCell>
                  <TableCell className="text-right">{day.hours.toFixed(1)}h</TableCell>
                  <TableCell className="text-right">{formatCurrency(day.laborCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(day.sales)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {day.laborPercentage.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(day.salesPerHour)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(day.avgHourlyRate)}</TableCell>
                  <TableCell className="text-center">
                    {getLaborPercentageIndicator(day.laborPercentage)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
