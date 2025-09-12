
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ProjectStatusDistributionProps {
  statusCounts: Array<{ name: string; value: number }>;
}

export const ProjectStatusDistribution: React.FC<ProjectStatusDistributionProps> = ({ statusCounts }) => {
  const COLORS = {
    'To Do': '#fbbf24',
    'In Progress': '#3b82f6',
    'Completed': '#10b981'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Status Distribution</CardTitle>
        <CardDescription>Overview of project statuses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusCounts}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {statusCounts.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface ProjectBudgetOverviewProps {
  budgetData: Array<{
    name: string;
    budget: number;
    spent: number;
    remaining: number;
  }>;
}

export const ProjectBudgetOverview: React.FC<ProjectBudgetOverviewProps> = ({ budgetData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Budget Overview</CardTitle>
        <CardDescription>Budget allocation and spending</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={budgetData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis />
            <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
            <Legend />
            <Bar dataKey="budget" fill="#3b82f6" name="Total Budget" />
            <Bar dataKey="spent" fill="#ef4444" name="Spent" />
            <Bar dataKey="remaining" fill="#10b981" name="Remaining" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
