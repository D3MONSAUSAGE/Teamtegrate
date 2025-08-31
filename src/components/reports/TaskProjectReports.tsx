import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  BarChart3, 
  TrendingUp,
  Download,
  Calendar,
  Target,
  Users
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TaskProjectReportsProps {
  memberId: string;
  teamId: string;
  timeRange: string;
}

export function TaskProjectReports({ memberId, teamId, timeRange }: TaskProjectReportsProps) {
  // Mock data for demonstration - replace with actual API calls
  const taskMetrics = {
    totalTasks: 32,
    completed: 24,
    inProgress: 6,
    overdue: 2,
    completionRate: 75,
    avgCompletionTime: 3.2,
    highPriorityCompleted: 8,
    mediumPriorityCompleted: 12,
    lowPriorityCompleted: 4
  };

  const projectContributions = [
    { name: 'Website Redesign', tasks: 12, completed: 10, completion: 83, status: 'active' },
    { name: 'Mobile App', tasks: 8, completed: 6, completion: 75, status: 'active' },
    { name: 'API Integration', tasks: 6, completed: 6, completion: 100, status: 'completed' },
    { name: 'Documentation', tasks: 4, completed: 2, completion: 50, status: 'active' },
    { name: 'Testing', tasks: 2, completed: 0, completion: 0, status: 'pending' }
  ];

  const dailyProductivity = [
    { day: 'Mon', completed: 4, created: 2 },
    { day: 'Tue', completed: 6, created: 3 },
    { day: 'Wed', completed: 3, created: 4 },
    { day: 'Thu', completed: 5, created: 2 },
    { day: 'Fri', completed: 4, created: 1 },
    { day: 'Sat', completed: 1, created: 0 },
    { day: 'Sun', completed: 1, created: 0 }
  ];

  const taskPriorityData = [
    { name: 'High Priority', value: taskMetrics.highPriorityCompleted, color: '#ef4444' },
    { name: 'Medium Priority', value: taskMetrics.mediumPriorityCompleted, color: '#f59e0b' },
    { name: 'Low Priority', value: taskMetrics.lowPriorityCompleted, color: '#10b981' }
  ];

  const recentTasks = [
    {
      id: '1',
      title: 'Update user authentication flow',
      status: 'completed',
      priority: 'high',
      completedDate: '2024-01-30',
      project: 'Website Redesign',
      daysToComplete: 2
    },
    {
      id: '2',
      title: 'Design mobile dashboard mockups',
      status: 'in-progress',
      priority: 'medium',
      dueDate: '2024-02-02',
      project: 'Mobile App',
      progress: 60
    },
    {
      id: '3',
      title: 'Write API documentation',
      status: 'completed',
      priority: 'medium',
      completedDate: '2024-01-29',
      project: 'Documentation',
      daysToComplete: 1
    },
    {
      id: '4',
      title: 'Implement payment gateway',
      status: 'overdue',
      priority: 'high',
      dueDate: '2024-01-28',
      project: 'Website Redesign',
      overdueDays: 3
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'in-progress': return 'bg-primary text-primary-foreground';
      case 'overdue': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-destructive';
      case 'medium': return 'border-l-warning';
      case 'low': return 'border-l-success';
      default: return 'border-l-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Task & Project Performance</h2>
          <p className="text-muted-foreground">
            Detailed analysis of task completion and project contributions
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Tasks
        </Button>
      </div>

      {/* Key Task Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{taskMetrics.totalTasks}</div>
            <p className="text-sm text-muted-foreground">This {timeRange.toLowerCase()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{taskMetrics.completionRate}%</div>
            <Progress value={taskMetrics.completionRate} className="w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Completion Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{taskMetrics.avgCompletionTime}d</div>
            <p className="text-sm text-success">15% faster than average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{taskMetrics.overdue}</div>
            <p className="text-sm text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Productivity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Daily Productivity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyProductivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" fill="hsl(var(--primary))" name="Completed" />
                <Bar dataKey="created" fill="hsl(var(--muted))" name="Created" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Task Priority Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskPriorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taskPriorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {taskPriorityData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Contributions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Project Contributions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectContributions.map((project, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{project.name}</h4>
                    <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{project.completed}/{project.tasks} tasks completed</span>
                    <span>•</span>
                    <span>{project.completion}% progress</span>
                  </div>
                </div>
                <div className="w-32">
                  <Progress value={project.completion} className="w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Task Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Task Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div key={task.id} className={`flex items-center justify-between p-4 border-l-4 bg-card rounded-lg ${getPriorityColor(task.priority)}`}>
                <div className="flex-1">
                  <h4 className="font-medium">{task.title}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{task.project}</span>
                    <Badge className={getStatusColor(task.status)} variant="secondary">
                      {task.status}
                    </Badge>
                    {task.status === 'completed' && (
                      <span>Completed in {task.daysToComplete} days</span>
                    )}
                    {task.status === 'overdue' && (
                      <span className="text-destructive">
                        Overdue by {task.overdueDays} days
                      </span>
                    )}
                  </div>
                </div>
                {task.status === 'in-progress' && task.progress && (
                  <div className="w-24">
                    <Progress value={task.progress} className="w-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}