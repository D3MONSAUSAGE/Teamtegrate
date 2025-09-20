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
  onDayClick?: (date: string) => void;
  selectedDate?: string | null;
}

export const DailyCompletionChart: React.FC<DailyCompletionChartProps> = ({ 
  data, 
  isLoading,
  onDayClick,
  selectedDate
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
            <BarChart 
              data={dailyData}
              onClick={(data) => {
                if (data && data.activeLabel && onDayClick) {
                  const clickedData = dailyData.find(item => item.day === data.activeLabel);
                  if (clickedData) {
                    onDayClick(clickedData.date);
                  }
                }
              }}
            >
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  value,
                  name === 'completed' ? 'Completed' : 'Pending'
                ]}
                labelFormatter={(label) => {
                  const dayData = dailyData.find(item => item.day === label);
                  return dayData ? `${label} (${dayData.date})` : label;
                }}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
              />
              <Bar 
                dataKey="completed" 
                fill="hsl(var(--chart-1))" 
                name="completed"
                opacity={1}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
              <Bar 
                dataKey="pending" 
                fill="hsl(var(--chart-3))" 
                name="pending"
                opacity={1}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {onDayClick && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Click on any bar to view detailed task information for that day
            {selectedDate && (
              <span className="text-primary"> • Selected: {format(new Date(selectedDate), 'MMM dd')}</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
};