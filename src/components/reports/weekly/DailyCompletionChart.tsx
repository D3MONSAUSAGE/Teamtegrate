import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface DailyCompletionChartProps {
  data: Array<{
    date: string;
    completed: number;
    total: number;
  }>;
  isLoading?: boolean;
}

export const DailyCompletionChart: React.FC<DailyCompletionChartProps> = ({ 
  data, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Task Completion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-64 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Generate last 7 days data
  const dailyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = data.find(d => d.date === dateStr) || { completed: 0, total: 0 };
    
    dailyData.push({
      day: format(date, 'MMM dd'),
      date: dateStr,
      completed: dayData.completed,
      pending: dayData.total - dayData.completed,
      total: dayData.total
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Daily Task Completion
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  value,
                  name === 'completed' ? 'Completed' : 'Pending'
                ]}
                labelFormatter={(label) => `${label}`}
              />
              <Bar 
                dataKey="completed" 
                fill="hsl(var(--chart-1))" 
                name="completed"
              />
              <Bar 
                dataKey="pending" 
                fill="hsl(var(--chart-3))" 
                name="pending"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};