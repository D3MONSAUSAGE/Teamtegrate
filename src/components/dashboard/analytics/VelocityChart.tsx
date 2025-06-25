
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from 'lucide-react';

interface VelocityData {
  period: string;
  completed: number;
  created: number;
  velocity: number;
}

interface VelocityChartProps {
  data: VelocityData[];
  timeRange: string;
}

const VelocityChart: React.FC<VelocityChartProps> = ({ data, timeRange }) => {
  const averageVelocity = data.reduce((sum, item) => sum + item.velocity, 0) / data.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">Task Velocity</CardTitle>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-amber-500">
              {averageVelocity.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Avg/period</div>
          </div>
        </div>
        <CardDescription>
          Tasks completed vs created per {timeRange.toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  value,
                  name === 'completed' ? 'Completed Tasks' : 
                  name === 'created' ? 'Created Tasks' : 'Net Velocity'
                ]}
              />
              <Bar dataKey="completed" fill="#10b981" name="completed" />
              <Bar dataKey="created" fill="#f59e0b" name="created" />
              <Bar 
                dataKey="velocity" 
                fill="#3b82f6" 
                name="velocity"
                opacity={0.7}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default VelocityChart;
