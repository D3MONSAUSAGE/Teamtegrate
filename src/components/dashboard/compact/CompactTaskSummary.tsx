import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Task } from '@/types';
import { isTaskOverdue } from '@/utils/taskUtils';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface CompactTaskSummaryProps {
  tasks: Task[];
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
}

const CompactTaskSummary: React.FC<CompactTaskSummaryProps> = ({
  tasks,
  onCreateTask,
  onEditTask
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const todaysTasks = tasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });

  const thisWeekTasks = tasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate > today && taskDate <= nextWeek;
  }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const overdueTasks = tasks.filter((task) => isTaskOverdue(task));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
      case 'Low': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600';
      case 'In Progress': return 'text-blue-600';
      case 'To Do': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const TaskItem: React.FC<{ task: Task; showDate?: boolean }> = ({ task, showDate = false }) => (
    <div 
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
      onClick={() => onEditTask(task)}
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(task.status) === 'text-green-600' ? 'bg-green-500' : 
                     getStatusColor(task.status) === 'text-blue-600' ? 'bg-blue-500' : 'bg-gray-400'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium truncate">{task.title}</span>
          <Badge variant="outline" className={`text-xs px-1 py-0 ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </Badge>
        </div>
        {showDate && (
          <div className="text-xs text-muted-foreground">
            {format(new Date(task.deadline), 'MMM d')}
          </div>
        )}
      </div>
      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Task Summary
          </span>
          <Button
            onClick={onCreateTask}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-8 text-xs">
            <TabsTrigger value="today" className="text-xs">
              Today ({todaysTasks.length})
            </TabsTrigger>
            <TabsTrigger value="overdue" className="text-xs">
              Overdue ({overdueTasks.length})
            </TabsTrigger>
            <TabsTrigger value="week" className="text-xs">
              Week ({thisWeekTasks.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className="mt-4 space-y-2">
            {todaysTasks.length > 0 ? (
              <>
                {todaysTasks.slice(0, 4).map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
                {todaysTasks.length > 4 && (
                  <Link to="/dashboard/tasks">
                    <Button variant="ghost" size="sm" className="w-full text-xs h-8">
                      View {todaysTasks.length - 4} more tasks
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No tasks for today
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="overdue" className="mt-4 space-y-2">
            {overdueTasks.length > 0 ? (
              <>
                {overdueTasks.slice(0, 4).map((task) => (
                  <TaskItem key={task.id} task={task} showDate />
                ))}
                {overdueTasks.length > 4 && (
                  <Link to="/dashboard/tasks">
                    <Button variant="ghost" size="sm" className="w-full text-xs h-8">
                      View {overdueTasks.length - 4} more overdue
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                All caught up!
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="week" className="mt-4 space-y-2">
            {thisWeekTasks.length > 0 ? (
              <>
                {thisWeekTasks.slice(0, 4).map((task) => (
                  <TaskItem key={task.id} task={task} showDate />
                ))}
                {thisWeekTasks.length > 4 && (
                  <Link to="/dashboard/tasks">
                    <Button variant="ghost" size="sm" className="w-full text-xs h-8">
                      View {thisWeekTasks.length - 4} more this week
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No upcoming tasks
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CompactTaskSummary;