import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  Calendar,
  User
} from 'lucide-react';
import { Task, Project } from '@/types';
import { isTaskOverdue } from '@/utils/taskUtils';

interface ModernTasksOverviewProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
}

const ModernTasksOverview: React.FC<ModernTasksOverviewProps> = ({
  tasks,
  projects,
  onTaskClick
}) => {
  const today = new Date();
  const todaysTasks = tasks.filter(task => {
    const taskDate = new Date(task.deadline);
    return taskDate.toDateString() === today.toDateString();
  });

  const upcomingTasks = tasks.filter(task => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const taskDate = new Date(task.deadline);
    return taskDate > new Date() && taskDate <= tomorrow;
  });

  const overdueTasks = tasks.filter(task => isTaskOverdue(task));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="h-4 w-4 text-dashboard-success" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-dashboard-warning" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Medium':
        return 'bg-dashboard-warning/10 text-dashboard-warning border-dashboard-warning/20';
      case 'Low':
        return 'bg-dashboard-success/10 text-dashboard-success border-dashboard-success/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div 
      onClick={() => onTaskClick(task)}
      className="group p-4 rounded-lg border border-border hover:bg-dashboard-card-hover transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {getStatusIcon(task.status)}
          <div className="space-y-1 flex-1">
            <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
              {task.title}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{new Date(task.deadline).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </Badge>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      {/* Today's Tasks */}
      <Card className="border-0 shadow-base bg-dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold text-foreground">Today's Tasks</CardTitle>
          <Badge variant="secondary" className="bg-dashboard-accent/10 text-dashboard-accent">
            {todaysTasks.length}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {todaysTasks.slice(0, 4).map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          {todaysTasks.length > 4 && (
            <Button variant="ghost" size="sm" className="w-full mt-2 text-primary hover:bg-primary/5">
              View all {todaysTasks.length} tasks <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
          {todaysTasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tasks for today</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Tasks */}
      <Card className="border-0 shadow-base bg-dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold text-foreground">Upcoming</CardTitle>
          <Badge variant="secondary" className="bg-dashboard-warning/10 text-dashboard-warning">
            {upcomingTasks.length}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingTasks.slice(0, 4).map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          {upcomingTasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No upcoming tasks</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card className="border-0 shadow-base bg-dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold text-foreground">Recent Projects</CardTitle>
          <Badge variant="secondary" className="bg-dashboard-info/10 text-dashboard-info">
            {projects.length}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {projects.slice(0, 4).map((project) => (
            <div 
              key={project.id}
              className="group p-4 rounded-lg border border-border hover:bg-dashboard-card-hover transition-all duration-200 cursor-pointer"
            >
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                  {project.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>Team project</span>
                  </div>
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No projects yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernTasksOverview;