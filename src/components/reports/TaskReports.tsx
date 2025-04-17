
import React from 'react';
import { useTask } from '@/contexts/task';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TaskStatus, TaskPriority } from '@/types';
import { format } from 'date-fns';
import { getTasksCompletionByDate } from '@/contexts/task/taskMetrics';

const TaskReports: React.FC = () => {
  const { tasks } = useTask();
  
  // Task status distribution data
  const statusCounts = React.useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      'To Do': 0,
      'In Progress': 0,
      'Pending': 0,
      'Completed': 0
    };
    
    tasks.forEach(task => {
      counts[task.status]++;
    });
    
    return Object.entries(counts).map(([status, count]) => ({
      name: status,
      value: count
    }));
  }, [tasks]);
  
  // Task priority distribution data
  const priorityCounts = React.useMemo(() => {
    const counts: Record<TaskPriority, number> = {
      'Low': 0,
      'Medium': 0,
      'High': 0
    };
    
    tasks.forEach(task => {
      counts[task.priority]++;
    });
    
    return Object.entries(counts).map(([priority, count]) => ({
      name: priority,
      value: count
    }));
  }, [tasks]);
  
  // Task completion trend (last 14 days)
  const completionTrend = React.useMemo(() => {
    const data = getTasksCompletionByDate(tasks, 14);
    return data.map(item => ({
      date: format(item.date, 'MMM dd'),
      completed: item.completed,
      total: item.total
    }));
  }, [tasks]);

  // Colors for the charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const PRIORITY_COLORS = {
    'Low': '#00C49F',
    'Medium': '#FFBB28',
    'High': '#FF8042'
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
            <CardDescription>Breakdown of tasks by status</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusCounts}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Task Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Priority Distribution</CardTitle>
            <CardDescription>Breakdown of tasks by priority level</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={priorityCounts}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="Tasks">
                  {priorityCounts.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={PRIORITY_COLORS[entry.name as TaskPriority] || COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Task Completion Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Task Completion Trend</CardTitle>
          <CardDescription>Task completion over the last 14 days</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={completionTrend}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" name="Completed Tasks" fill="#00C49F" />
              <Bar dataKey="total" name="Total Tasks" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskReports;
