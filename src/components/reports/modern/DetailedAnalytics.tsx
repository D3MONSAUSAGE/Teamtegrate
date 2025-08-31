import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckSquare, 
  Clock, 
  FolderOpen, 
  TrendingUp,
  Calendar,
  Users,
  Target,
  Award
} from 'lucide-react';
import { format } from 'date-fns';

interface DetailedAnalyticsProps {
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

const TaskAnalytics: React.FC<{ taskStats: any }> = ({ taskStats }) => {
  // Mock detailed task data
  const taskBreakdown = [
    { priority: 'High', completed: 8, total: 12, percentage: 67 },
    { priority: 'Medium', completed: 15, total: 18, percentage: 83 },
    { priority: 'Low', completed: 5, total: 6, percentage: 83 }
  ];

  const recentTasks = [
    { name: 'Complete project proposal', status: 'Completed', date: new Date(), priority: 'High' },
    { name: 'Review team feedback', status: 'In Progress', date: new Date(), priority: 'Medium' },
    { name: 'Update documentation', status: 'Completed', date: new Date(), priority: 'Low' },
    { name: 'Prepare presentation', status: 'To Do', date: new Date(), priority: 'High' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {taskBreakdown.map((item, index) => (
          <Card key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{item.priority} Priority</span>
                <Badge variant={item.priority === 'High' ? 'destructive' : item.priority === 'Medium' ? 'default' : 'secondary'}>
                  {item.percentage}%
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-2">
                {item.completed}/{item.total}
              </div>
              <Progress value={item.percentage} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Task Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTasks.map((task, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{task.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(task.date, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={task.status === 'Completed' ? 'default' : task.status === 'In Progress' ? 'secondary' : 'outline'}
                  >
                    {task.status}
                  </Badge>
                  <Badge 
                    variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'default' : 'secondary'}
                  >
                    {task.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const TimeAnalytics: React.FC<{ hoursStats: any }> = ({ hoursStats }) => {
  const timeBreakdown = [
    { category: 'Focused Work', hours: 24, percentage: 60 },
    { category: 'Meetings', hours: 8, percentage: 20 },
    { category: 'Administration', hours: 5, percentage: 12.5 },
    { category: 'Learning', hours: 3, percentage: 7.5 }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {timeBreakdown.map((item, index) => (
          <Card key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{item.category}</span>
              </div>
              <div className="text-2xl font-bold mb-2">{item.hours}h</div>
              <div className="text-sm text-muted-foreground">{item.percentage}% of total</div>
              <Progress value={item.percentage} className="h-2 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Time Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2 text-center text-sm text-muted-foreground">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {[8.5, 7.2, 8.8, 6.5, 7.0, 2.0, 0.5].map((hours, index) => (
                <div key={index} className="text-center">
                  <div className="bg-primary/10 rounded p-3 mb-1">
                    <div className="text-lg font-semibold">{hours}h</div>
                  </div>
                  <div className={`h-2 rounded ${hours > 8 ? 'bg-warning' : hours > 6 ? 'bg-primary' : 'bg-muted'}`} />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ProjectAnalytics: React.FC<{ contributions: any[] }> = ({ contributions }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contributions?.slice(0, 6).map((project, index) => (
          <Card key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <FolderOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium truncate">{project.project_title}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tasks: {project.task_count}</span>
                  <span>{Math.round(project.completion_rate)}% complete</span>
                </div>
                <Progress value={project.completion_rate} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )) || []}
      </div>

      {contributions?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Project Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {contributions.length}
                </div>
                <div className="text-sm text-muted-foreground">Active Projects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-2">
                  {contributions.reduce((sum, p) => sum + p.task_count, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-warning mb-2">
                  {Math.round(contributions.reduce((sum, p) => sum + p.completion_rate, 0) / contributions.length)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Completion</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const DetailedAnalytics: React.FC<DetailedAnalyticsProps> = ({
  taskStats,
  hoursStats,
  contributions,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card className="animate-shimmer">
        <CardContent className="p-6">
          <div className="h-96 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '800ms' }}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span>Detailed Analytics</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks" className="flex items-center space-x-2">
              <CheckSquare className="h-4 w-4" />
              <span>Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="time" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Time</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center space-x-2">
              <FolderOpen className="h-4 w-4" />
              <span>Projects</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="tasks" className="space-y-6">
              <TaskAnalytics taskStats={taskStats} />
            </TabsContent>
            
            <TabsContent value="time" className="space-y-6">
              <TimeAnalytics hoursStats={hoursStats} />
            </TabsContent>
            
            <TabsContent value="projects" className="space-y-6">
              <ProjectAnalytics contributions={contributions || []} />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};