
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
import { useIsMobile } from '@/hooks/use-mobile';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const TaskReports: React.FC = () => {
  const { tasks } = useTask();
  const isMobile = useIsMobile();
  
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
  
  // Responsive label rendering function for the pie chart
  const renderPieChartLabel = ({ name, percent }: { name: string; percent: number }) => {
    // Only show labels on desktop or for sections with enough space (more than 10%)
    if (!isMobile || percent > 0.1) {
      return `${name}: ${(percent * 100).toFixed(0)}%`;
    }
    return null;
  };
  
  const chartConfig = {
    // Define colors for each status
    'To Do': { color: COLORS[0] },
    'In Progress': { color: COLORS[1] },
    'Pending': { color: COLORS[2] },
    'Completed': { color: COLORS[3] },
    'Low': { color: PRIORITY_COLORS['Low'] },
    'Medium': { color: PRIORITY_COLORS['Medium'] },
    'High': { color: PRIORITY_COLORS['High'] }
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
            <ChartContainer config={chartConfig} className="h-full">
              <PieChart>
                <Pie
                  data={statusCounts}
                  cx="50%"
                  cy="50%"
                  labelLine={!isMobile}
                  outerRadius={isMobile ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={renderPieChartLabel}
                >
                  {statusCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <Legend layout={isMobile ? "horizontal" : "vertical"} verticalAlign="bottom" align="center" />
              </PieChart>
            </ChartContainer>
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
                margin={isMobile ? 
                  { top: 20, right: 10, left: 10, bottom: 30 } : 
                  { top: 20, right: 30, left: 20, bottom: 5 }
                }
                layout={isMobile ? "vertical" : "horizontal"}
              >
                <CartesianGrid strokeDasharray="3 3" />
                {isMobile ? (
                  <>
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={70} />
                  </>
                ) : (
                  <>
                    <XAxis dataKey="name" />
                    <YAxis />
                  </>
                )}
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
              margin={isMobile ? 
                { top: 20, right: 10, left: 0, bottom: 50 } : 
                { top: 20, right: 30, left: 20, bottom: 5 }
              }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? "end" : "middle"}
                height={isMobile ? 60 : 30}
                tick={{ fontSize: isMobile ? 10 : 12 }}
              />
              <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
              <Tooltip />
              <Legend wrapperStyle={isMobile ? { position: 'relative', marginTop: '10px' } : undefined} />
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
