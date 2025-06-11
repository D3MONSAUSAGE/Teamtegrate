
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from '@/types';

interface ProjectProgressChartProps {
  projects: Project[];
}

const ProjectProgressChart: React.FC<ProjectProgressChartProps> = ({ projects }) => {
  const data = projects.map(project => {
    const completionRate = project.tasks_count > 0 
      ? ((project.tasks_count - (project.tasks_count * 0.3)) / project.tasks_count) * 100 
      : 0;
    
    return {
      name: project.title.length > 15 ? `${project.title.substring(0, 15)}...` : project.title,
      completion: Math.round(completionRate),
      budget: project.budget,
      spent: project.budgetSpent
    };
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-medium">Project Progress</CardTitle>
          <CardDescription>Completion rates across projects</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis fontSize={12} />
            <Tooltip />
            <Bar dataKey="completion" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProjectProgressChart;
