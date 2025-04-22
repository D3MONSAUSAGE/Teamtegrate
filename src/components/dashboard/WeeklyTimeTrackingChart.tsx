
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface WeeklyTimeTrackingChartProps {
  data: Array<{
    day: string;
    totalHours: number;
  }>;
}

const WeeklyTimeTrackingChart: React.FC<WeeklyTimeTrackingChartProps> = ({ data }) => {
  // Find the maximum hours value for setting the chart domain
  const maxHours = Math.max(...data.map(item => item.totalHours), 8);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Weekly Time Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 0,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="day" 
              tickLine={false}
              axisLine={false}
              padding={{ left: 10, right: 10 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}h`}
              domain={[0, maxHours * 1.2]}
            />
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(2)} hours`, 'Time']}
              labelFormatter={(label) => `${label}`}
            />
            <Area
              type="monotone"
              dataKey="totalHours"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorHours)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default WeeklyTimeTrackingChart;
