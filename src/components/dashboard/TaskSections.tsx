
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task } from '@/types';
import TaskCard from '@/components/task-card';
import { Calendar, AlertTriangle } from 'lucide-react';

interface TaskSectionsProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onEdit: (task: Task) => void;
  onStatusChange: (taskId: string, status: Task['status']) => Promise<void>;
}

const TaskSections: React.FC<TaskSectionsProps> = ({ 
  tasks, 
  onTaskClick, 
  onEdit, 
  onStatusChange 
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTasks = tasks.filter(task => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  }).slice(0, 3); // Show only 3 tasks

  const overdueTasks = tasks.filter(task => {
    const taskDate = new Date(task.deadline);
    return taskDate < today && task.status !== 'Completed';
  }).slice(0, 3); // Show only 3 tasks

  const TaskSection = ({ 
    title, 
    tasks, 
    icon: Icon, 
    emptyMessage 
  }: { 
    title: string; 
    tasks: Task[]; 
    icon: React.ComponentType<any>; 
    emptyMessage: string;
  }) => (
    <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-purple-500 text-white">
            <Icon className="h-5 w-5" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <TaskCard
                  task={task}
                  onEdit={onEdit}
                  onClick={() => onTaskClick(task)}
                  onStatusChange={onStatusChange}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <TaskSection
        title="Today's Tasks"
        tasks={todayTasks}
        icon={Calendar}
        emptyMessage="No tasks scheduled for today"
      />
      
      {overdueTasks.length > 0 && (
        <TaskSection
          title="Overdue Tasks"
          tasks={overdueTasks}
          icon={AlertTriangle}
          emptyMessage="No overdue tasks"
        />
      )}
    </div>
  );
};

export default TaskSections;
