import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, ComposedChart } from 'recharts';

interface CompletionTrendData {
  date: string;
  completed: number;
  inProgress: number;
  accuracy: number;
}

interface CompletionTrendChartProps {
  data: CompletionTrendData[];
}

export const CompletionTrendChart: React.FC<CompletionTrendChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="date" 
          className="text-xs"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          yAxisId="counts"
          orientation="left"
          className="text-xs"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          yAxisId="accuracy"
          orientation="right"
          domain={[0, 100]}
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
            name === 'completed' ? `${value} completed` :
            name === 'inProgress' ? `${value} in progress` :
            `${Number(value).toFixed(1)}%`,
            name === 'completed' ? 'Completed Counts' :
            name === 'inProgress' ? 'In Progress' :
            'Accuracy Rate'
          ]}
        />
        <Legend />
        <Bar 
          yAxisId="counts"
          dataKey="completed" 
          fill="hsl(var(--primary))" 
          name="Completed"
          radius={[2, 2, 0, 0]}
        />
        <Bar 
          yAxisId="counts"
          dataKey="inProgress" 
          fill="hsl(var(--secondary))" 
          name="In Progress"
          radius={[2, 2, 0, 0]}
        />
        <Line 
          yAxisId="accuracy"
          type="monotone" 
          dataKey="accuracy" 
          stroke="hsl(var(--accent))" 
          strokeWidth={3}
          name="Accuracy Rate"
          dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: 'hsl(var(--accent))', strokeWidth: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};