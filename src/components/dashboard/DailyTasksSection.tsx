
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/types';
import { Plus, Calendar, Clock, AlertCircle, CheckCircle2, Target } from 'lucide-react';
import { format, isToday, isTomorrow, isOverdue } from 'date-fns';
import { cn } from '@/lib/utils';

interface DailyTasksSectionProps {
  tasks: Task[];
  onCreateTask: () => void;
  onTaskClick: (task: Task) => void;
}

const DailyTasksSection: React.FC<DailyTasksSectionProps> = ({ 
  tasks, 
  onCreateTask, 
  onTaskClick 
}) => {
  const todayTasks = tasks.filter(task => isToday(new Date(task.deadline)));
  const tomorrowTasks = tasks.filter(task => isTomorrow(new Date(task.deadline)));
  const overdueTasks = tasks.filter(task => isOverdue(new Date(task.deadline)) && task.status !== 'completed');

  const getTaskStatusColor = (task: Task) => {
    if (task.status === 'completed') return 'from-green-500 to-emerald-600';
    if (task.status === 'inprogress') return 'from-amber-500 to-orange-600';
    if (isOverdue(new Date(task.deadline))) return 'from-red-500 to-rose-600';
    return 'from-blue-500 to-indigo-600';
  };

  const getTaskStatusIcon = (task: Task) => {
    if (task.status === 'completed') return <CheckCircle2 className="h-4 w-4" />;
    if (task.status === 'inprogress') return <Clock className="h-4 w-4" />;
    if (isOverdue(new Date(task.deadline))) return <AlertCircle className="h-4 w-4" />;
    return <Target className="h-4 w-4" />;
  };

  const TaskCard = ({ task, index }: { task: Task; index: number }) => (
    <div
      key={task.id}
      className={cn(
        "group p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:shadow-md animate-fade-in",
        "bg-card/80 hover:bg-card border-border/50 hover:border-primary/30 hover:scale-[1.02]"
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={() => onTaskClick(task)}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg bg-gradient-to-r text-white shadow-sm",
          getTaskStatusColor(task)
        )}>
          {getTaskStatusIcon(task)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm truncate text-foreground">
              {task.title}
            </h3>
            <Badge
              variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {task.priority}
            </Badge>
          </div>
          
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(task.deadline), 'MMM dd')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                task.status === 'completed' ? 'bg-green-500' : 
                task.status === 'inprogress' ? 'bg-amber-500' : 'bg-blue-500'
              )} />
              <span className="capitalize">{task.status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const TaskSection = ({ 
    title, 
    tasks, 
    icon: Icon, 
    color, 
    emptyMessage 
  }: { 
    title: string; 
    tasks: Task[]; 
    icon: React.ComponentType<any>; 
    color: string;
    emptyMessage: string;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-gradient-to-r text-white", color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          tasks.map((task, index) => (
            <TaskCard key={task.id} task={task} index={index} />
          ))
        )}
      </div>
    </div>
  );

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-card/50 via-card/80 to-card/50 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-purple-500 text-white">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Today's Tasks
              </CardTitle>
              <p className="text-sm text-muted-foreground">Stay on top of your schedule</p>
            </div>
          </div>
          
          <Button
            onClick={onCreateTask}
            className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <TaskSection
            title="Overdue"
            tasks={overdueTasks}
            icon={AlertCircle}
            color="from-red-500 to-rose-600"
            emptyMessage="No overdue tasks"
          />
        )}

        {/* Today's Tasks */}
        <TaskSection
          title="Today"
          tasks={todayTasks}
          icon={Target}
          color="from-blue-500 to-indigo-600"
          emptyMessage="No tasks scheduled for today"
        />

        {/* Tomorrow's Tasks */}
        {tomorrowTasks.length > 0 && (
          <TaskSection
            title="Tomorrow"
            tasks={tomorrowTasks}
            icon={Clock}
            color="from-purple-500 to-pink-600"
            emptyMessage="No tasks scheduled for tomorrow"
          />
        )}

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Tasks Yet</h3>
            <p className="text-muted-foreground mb-6">Create your first task to get started</p>
            <Button
              onClick={onCreateTask}
              className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-600 text-white shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Task
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyTasksSection;
