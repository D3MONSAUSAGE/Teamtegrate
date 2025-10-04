import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Clock, TrendingUp, Percent, Activity, Users } from 'lucide-react';
import { WeeklyPayrollSummary } from '@/types/payroll';

interface PayrollSummaryCardsProps {
  summary: WeeklyPayrollSummary;
}

export const PayrollSummaryCards: React.FC<PayrollSummaryCardsProps> = ({ summary }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getLaborPercentageColor = (percentage: number) => {
    if (percentage < 25) return 'text-success';
    if (percentage < 35) return 'text-warning';
    return 'text-destructive';
  };

  const getSalesPerHourColor = (salesPerHour: number) => {
    if (salesPerHour > 75) return 'text-success';
    if (salesPerHour > 50) return 'text-warning';
    return 'text-destructive';
  };

  const cards = [
    {
      title: 'Total Payroll',
      value: formatCurrency(summary.totalLaborCost),
      icon: DollarSign,
      color: 'text-primary',
    },
    {
      title: 'Total Hours',
      value: `${summary.totalHours.toFixed(1)}h`,
      icon: Clock,
      color: 'text-primary',
    },
    {
      title: 'Total Sales',
      value: formatCurrency(summary.totalSales),
      icon: TrendingUp,
      color: 'text-primary',
    },
    {
      title: 'Labor Cost %',
      value: `${summary.laborPercentage.toFixed(1)}%`,
      icon: Percent,
      color: getLaborPercentageColor(summary.laborPercentage),
    },
    {
      title: 'Sales per Hour',
      value: formatCurrency(summary.salesPerLaborHour),
      icon: Activity,
      color: getSalesPerHourColor(summary.salesPerLaborHour),
    },
    {
      title: 'Avg Hourly Rate',
      value: formatCurrency(summary.avgHourlyRate),
      icon: Users,
      color: 'text-primary',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
