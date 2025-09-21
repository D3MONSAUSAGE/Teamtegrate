import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AlertTrendsData {
  date: string;
  lowStock: number;
  overStock: number;
  expired: number;
}

interface AlertTrendsChartProps {
  data: AlertTrendsData[];
}

export const AlertTrendsChart: React.FC<AlertTrendsChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="date" 
          className="text-xs"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          className="text-xs"
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
          }}
          formatter={(value, name) => [
            `${value} alerts`,
            name === 'lowStock' ? 'Low Stock' :
            name === 'overStock' ? 'Over Stock' :
            'Expired Items'
          ]}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="lowStock" 
          stroke="hsl(var(--warning))" 
          strokeWidth={2}
          name="Low Stock"
          dot={{ fill: 'hsl(var(--warning))', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: 'hsl(var(--warning))', strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="overStock" 
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
          name="Over Stock"
          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="expired" 
          stroke="hsl(var(--destructive))" 
          strokeWidth={2}
          name="Expired"
          dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: 'hsl(var(--destructive))', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};