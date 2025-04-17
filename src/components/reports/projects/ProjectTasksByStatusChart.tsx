
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectTaskStatusData } from '../types';

interface ProjectTasksByStatusChartProps {
  projectTasksByStatus: ProjectTaskStatusData[];
  statusColors: Record<string, string>;
}

const ProjectTasksByStatusChart: React.FC<ProjectTasksByStatusChartProps> = ({ 
  projectTasksByStatus, 
  statusColors 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Tasks by Status</CardTitle>
        <CardDescription>Distribution of task statuses within top 5 projects</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={projectTasksByStatus}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10 }} 
              interval={0} 
              angle={-45} 
              textAnchor="end" 
              height={60} 
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="To Do" name="To Do" fill={statusColors['To Do']} />
            <Bar dataKey="In Progress" name="In Progress" fill={statusColors['In Progress']} />
            <Bar dataKey="Pending" name="Pending" fill={statusColors['Pending']} />
            <Bar dataKey="Completed" name="Completed" fill={statusColors['Completed']} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProjectTasksByStatusChart;
