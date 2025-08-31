import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { CalendarDays, TrendingUp, Clock, Target } from 'lucide-react';

interface PerformanceGridProps {
  taskStats?: {
    completed_tasks: number;
    total_tasks: number;
    completion_rate: number;
  };
  hoursStats?: {
    total_hours: number;
    avg_daily_hours: number;
    overtime_hours: number;
  };
  contributions?: Array<{
    project_title: string;
    task_count: number;
    completion_rate: number;
  }>;
  isLoading?: boolean;
}

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

// Mock data for demonstration
const generateWeeklyData = (taskStats: any, hoursStats: any) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, index) => ({
    day,
    tasks: Math.floor(Math.random() * 8) + 2,
    hours: Math.floor(Math.random() * 4) + 6,
    productivity: Math.floor(Math.random() * 30) + 70,
    focus: Math.floor(Math.random() * 20) + 80
  }));
};

const generateProjectData = (contributions: any[]) => {
  return contributions?.slice(0, 5).map(project => ({
    name: project.project_title.length > 15 
      ? project.project_title.substring(0, 15) + '...' 
      : project.project_title,
    tasks: project.task_count,
    completion: project.completion_rate
  })) || [];
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-card-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
            {entry.dataKey === 'hours' && 'h'}
            {entry.dataKey === 'productivity' && '%'}
            {entry.dataKey === 'completion' && '%'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const PerformanceGrid: React.FC<PerformanceGridProps> = ({
  taskStats,
  hoursStats,
  contributions,
  isLoading
}) => {
  const weeklyData = generateWeeklyData(taskStats, hoursStats);
  const projectData = generateProjectData(contributions || []);
  
  // Task distribution data
  const taskDistribution = [
    { name: 'Completed', value: taskStats?.completed_tasks || 0 },
    { name: 'In Progress', value: (taskStats?.total_tasks || 0) - (taskStats?.completed_tasks || 0) },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-shimmer">
            <CardHeader>
              <div className="h-6 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Performance Trend */}
      <Card className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '400ms' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Weekly Performance Trend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="tasksGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="day" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="tasks"
                stroke="hsl(217, 91%, 60%)"
                fillOpacity={1}
                fill="url(#tasksGradient)"
                name="Tasks Completed"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="hsl(142, 76%, 36%)"
                fillOpacity={1}
                fill="url(#hoursGradient)"
                name="Hours Worked"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Task Distribution */}
      <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <span>Task Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={taskDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
              >
                {taskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Project Contributions */}
      <Card className="animate-fade-in" style={{ animationDelay: '600ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span>Project Contributions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={projectData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="tasks" 
                fill="hsl(217, 91%, 60%)" 
                radius={[0, 4, 4, 0]}
                name="Tasks"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};