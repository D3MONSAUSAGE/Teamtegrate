
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Task } from '@/types';
import { format } from 'date-fns';

interface TasksOverviewProps {
  tasks: Task[];
  onCreateTask: () => void;
}

const TasksOverview: React.FC<TasksOverviewProps> = ({ tasks, onCreateTask }) => {
  const pendingTasks = tasks.filter(task => task.status !== 'Completed').slice(0, 3);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const handleCreateTaskClick = () => {
    console.log('TasksOverview: Create task button clicked');
    onCreateTask();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Recent Tasks</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCreateTaskClick}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        {pendingTasks.length > 0 ? (
          <div className="space-y-4">
            {pendingTasks.map(task => (
              <div key={task.id} className="flex items-center space-x-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex-shrink-0">
                  {getStatusIcon(task.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  {task.deadline && (
                    <p className="text-xs text-muted-foreground">
                      Due {format(new Date(task.deadline), 'MMM dd')}
                    </p>
                  )}
                </div>
                <Badge className={getPriorityColor(task.priority)} variant="secondary">
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-sm font-medium mb-2">No tasks yet</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Create your first task to get started
            </p>
            <Button onClick={handleCreateTaskClick} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TasksOverview;
