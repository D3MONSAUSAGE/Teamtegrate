
import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompletionData } from '../types';

interface ProjectTimelineChartProps {
  onTimeCompletionData: CompletionData[];
  colors: string[];
}

const ProjectTimelineChart: React.FC<ProjectTimelineChartProps> = ({ 
  onTimeCompletionData, 
  colors 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline Analysis</CardTitle>
        <CardDescription>On-time vs. delayed project completion</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={onTimeCompletionData}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {onTimeCompletionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProjectTimelineChart;
