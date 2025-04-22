
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/**
 * Props:
 *  - data: Array<{ day: string, totalHours: number }>
 *    Should have 7 entries for each week day.
 */
interface WeeklyTimeTrackingChartProps {
  data: { day: string; totalHours: number }[];
}

const WeeklyTimeTrackingChart: React.FC<WeeklyTimeTrackingChartProps> = ({ data }) => (
  <Card>
    <CardHeader>
      <CardTitle>Weekly Time Trend</CardTitle>
    </CardHeader>
    <CardContent className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis allowDecimals={false} label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Line type="monotone" dataKey="totalHours" stroke="#9b87f5" strokeWidth={3} activeDot={{ r: 7 }} />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export default WeeklyTimeTrackingChart;
