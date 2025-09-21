import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface VarianceAnalysisData {
  date: string;
  variance: number;
  items: number;
}

interface VarianceAnalysisChartProps {
  data: VarianceAnalysisData[];
}

export const VarianceAnalysisChart: React.FC<VarianceAnalysisChartProps> = ({ data }) => {
  // Calculate variance rate for each data point
  const processedData = data.map(item => ({
    ...item,
    varianceRate: item.items > 0 ? (item.variance / item.items) * 100 : 0
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
          formatter={(value, name, props) => {
            if (name === 'variance') {
              return [`${value} variances`, 'Variance Count'];
            }
            if (name === 'varianceRate') {
              return [`${Number(value).toFixed(1)}%`, 'Variance Rate'];
            }
            return [value, name];
          }}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Bar 
          dataKey="variance" 
          name="variance"
          radius={[4, 4, 0, 0]}
        >
          {processedData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.varianceRate > 10 ? 'hsl(var(--destructive))' : 
                   entry.varianceRate > 5 ? 'hsl(var(--warning))' : 
                   'hsl(var(--primary))'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};