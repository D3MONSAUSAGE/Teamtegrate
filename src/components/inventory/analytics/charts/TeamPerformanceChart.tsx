import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TeamPerformanceData {
  team: string;
  accuracy: number;
  counts: number;
  avgTime: number;
}

interface TeamPerformanceChartProps {
  data: TeamPerformanceData[];
}

export const TeamPerformanceChart: React.FC<TeamPerformanceChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="team" 
          className="text-xs"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
        />
        <YAxis 
          yAxisId="accuracy"
          orientation="left"
          domain={[80, 100]}
          className="text-xs"
          tick={{ fontSize: 12 }}
          label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
        />
        <YAxis 
          yAxisId="counts"
          orientation="right"
          className="text-xs"
          tick={{ fontSize: 12 }}
          label={{ value: 'Count Operations', angle: 90, position: 'insideRight' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
          }}
          formatter={(value, name) => [
            name === 'accuracy' ? `${Number(value).toFixed(1)}%` :
            name === 'counts' ? `${value} counts` :
            `${Number(value).toFixed(1)}h`,
            name === 'accuracy' ? 'Accuracy Rate' :
            name === 'counts' ? 'Total Counts' :
            'Avg Completion Time'
          ]}
        />
        <Legend />
        <Bar 
          yAxisId="accuracy"
          dataKey="accuracy" 
          fill="hsl(var(--primary))" 
          name="Accuracy Rate"
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          yAxisId="counts"
          dataKey="counts" 
          fill="hsl(var(--secondary))" 
          name="Total Counts"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};