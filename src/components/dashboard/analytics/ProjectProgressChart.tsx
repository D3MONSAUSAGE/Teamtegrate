
import React from 'react';
import { Project } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProjectProgressChartProps {
  projects: Project[];
}

const ProjectProgressChart: React.FC<ProjectProgressChartProps> = ({ projects }) => {
  const data = projects.map(project => ({
    name: project.title,
    completed: project.tasksCount || 0,
    total: project.tasksCount || 0,
    progress: project.tasksCount > 0 ? Math.round((project.tasksCount / project.tasksCount) * 100) : 0
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="progress" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProjectProgressChart;
