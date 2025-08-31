import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface WeeklyTrendChartProps {
  data: Array<{
    date: string;
    completed: number;
    total: number;
  }>;
  isLoading?: boolean;
}

export const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({ 
  data, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Completion Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-64 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Generate last 7 days data
  const weekData = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = data.find(d => d.date === dateStr) || { completed: 0, total: 0 };
    
    weekData.push({
      day: format(date, 'EEE'),
      date: dateStr,
      completed: dayData.completed,
      total: dayData.total,
      completionRate: dayData.total > 0 ? Math.round((dayData.completed / dayData.total) * 100) : 0
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Weekly Completion Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'completed' ? `${value} completed` : `${value}%`,
                  name === 'completed' ? 'Tasks Completed' : 'Completion Rate'
                ]}
                labelFormatter={(label) => `${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
              <Line 
                type="monotone" 
                dataKey="completionRate" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'hsl(var(--chart-2))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};