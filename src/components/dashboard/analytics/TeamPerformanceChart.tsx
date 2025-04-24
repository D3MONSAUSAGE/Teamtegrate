
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Task } from '@/types';

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
      <div className="h-[180px] w-full flex items-center justify-center text-gray-500">
        <p>No completed tasks assigned to team members</p>
      </div>
    );
  }
  
  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={60}
            innerRadius={30}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value} tasks`, 'Completed']} 
            contentStyle={{ 
              borderRadius: '6px',
              fontSize: '12px',
              padding: '6px 10px',
            }}
          />
          <Legend 
            layout="horizontal" 
            verticalAlign="bottom" 
            align="center"
            wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }}
            formatter={(value) => <span style={{ fontSize: '10px' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TeamPerformanceChart;
