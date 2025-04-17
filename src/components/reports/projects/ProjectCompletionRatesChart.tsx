
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStatusData } from '../types';

interface ProjectCompletionRatesChartProps {
  projectStatus: ProjectStatusData[];
}

const ProjectCompletionRatesChart: React.FC<ProjectCompletionRatesChartProps> = ({ projectStatus }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Completion Rates</CardTitle>
        <CardDescription>Progress of each project</CardDescription>
      </CardHeader>
      <CardContent className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={projectStatus}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} unit="%" />
            <YAxis type="category" dataKey="name" width={150} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            <Bar 
              dataKey="completionRate" 
              name="Completion Rate" 
              fill="#0088FE"
              background={{ fill: '#eee' }}
            >
              {projectStatus.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isOverdue ? '#FF8042' : '#0088FE'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProjectCompletionRatesChart;
