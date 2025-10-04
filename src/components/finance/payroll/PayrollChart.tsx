import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { DailyPayrollData } from '@/types/payroll';

interface PayrollChartProps {
  dailyData: DailyPayrollData[];
}

export const PayrollChart: React.FC<PayrollChartProps> = ({ dailyData }) => {
  const chartData = dailyData.map(day => ({
    date: format(parseISO(day.date), 'EEE M/d'),
    laborCost: day.laborCost,
    sales: day.sales,
    laborPercentage: day.laborPercentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Payroll vs Sales Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              yAxisId="left"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `${value.toFixed(0)}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'laborPercentage') return [`${value.toFixed(1)}%`, 'Labor %'];
                return [`$${value.toLocaleString()}`, name === 'laborCost' ? 'Labor Cost' : 'Sales'];
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="sales" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Sales"
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="laborCost" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              name="Labor Cost"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="laborPercentage" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Labor %"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
