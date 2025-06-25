
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface CompletionTrendData {
  date: string;
  completed: number;
  total: number;
  completionRate: number;
}

interface CompletionTrendChartProps {
  data: CompletionTrendData[];
  timeRange: string;
}

const CompletionTrendChart: React.FC<CompletionTrendChartProps> = ({ data, timeRange }) => {
  const formatTooltipDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd');
    } catch {
      return dateStr;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-lg">Task Completion Trend</CardTitle>
        </div>
        <CardDescription>
          Task completion rate over the last {timeRange}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={formatTooltipDate}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                labelFormatter={(label) => formatTooltipDate(label)}
                formatter={(value: number, name: string) => [
                  name === 'completionRate' ? `${value.toFixed(1)}%` : value,
                  name === 'completionRate' ? 'Completion Rate' : 
                  name === 'completed' ? 'Completed Tasks' : 'Total Tasks'
                ]}
              />
              <Line
                type="monotone"
                dataKey="completionRate"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompletionTrendChart;
