
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Task } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from 'lucide-react';

interface TeamPerformanceChartProps {
  tasks: Task[];
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const TeamPerformanceChart: React.FC<TeamPerformanceChartProps> = ({ tasks }) => {
  const chartData = useMemo(() => {
    const assignedTasks = tasks.filter(task => task.assignedToId);
    
    // Group by assignee
    const groupedByAssignee = assignedTasks.reduce((acc, task) => {
      const assigneeName = task.assignedToName || 'Unassigned';
      if (!acc[assigneeName]) {
        acc[assigneeName] = {
          total: 0,
          completed: 0
        };
      }
      
      acc[assigneeName].total++;
      if (task.status === 'Completed') {
        acc[assigneeName].completed++;
      }
      
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);
    
    // Convert to chart data
    return Object.entries(groupedByAssignee).map(([name, data], index) => ({
      name,
      value: data.completed,
      color: COLORS[index % COLORS.length]
    })).filter(item => item.value > 0);
  }, [tasks]);
  
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Performance
          </CardTitle>
          <CardDescription>Task completion by team members</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-gray-500">
          <p>No completed tasks assigned to team members</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Performance
        </CardTitle>
        <CardDescription>Task completion by team members</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius="80%"
              innerRadius="50%"
              fill="#8884d8"
              dataKey="value"
              paddingAngle={5}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} tasks`, 'Completed']} />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              wrapperStyle={{ 
                paddingTop: '10px',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TeamPerformanceChart;
