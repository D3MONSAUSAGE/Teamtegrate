
import React from 'react';
import { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, AlertTriangle, Calendar } from 'lucide-react';
import TaskCard from '@/components/task-card/TaskCard';

interface OverdueTasksSectionProps {
  tasks: Task[];
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onStatusChange?: (taskId: string, status: string) => Promise<void>;
}

const OverdueTasksSection: React.FC<OverdueTasksSectionProps> = ({
  tasks,
  onCreateTask,
  onEditTask,
  onStatusChange
}) => {
  const hasOverdueTasks = tasks.length > 0;
  
  // Calculate completion progress for overdue tasks
  const completedOverdueTasks = tasks.filter(task => task.status === 'Completed').length;
  const totalOverdueTasks = tasks.length;
  const completionPercentage = totalOverdueTasks > 0 ? Math.round((completedOverdueTasks / totalOverdueTasks) * 100) : 0;

  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50/40 via-orange-50/30 to-yellow-50/20 dark:from-red-950/20 dark:via-orange-950/10 dark:to-yellow-950/5 rounded-xl" />
      
      {/* Content */}
      <div className="relative p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 dark:bg-red-500/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
                Overdue Tasks
              </h2>
              <p className="text-sm text-red-600 dark:text-red-400">
                {hasOverdueTasks ? `${tasks.length} task${tasks.length === 1 ? '' : 's'} need attention` : 'All caught up!'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasOverdueTasks && (
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20">
                View all
              </Button>
            )}
            <Button 
              onClick={onCreateTask}
              size="sm" 
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Task
            </Button>
          </div>
        </div>

        {/* Progress Bar for Overdue Tasks */}
        {hasOverdueTasks && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-700 dark:text-red-300 font-medium">
                Progress on Overdue Tasks
              </span>
              <span className="text-red-600 dark:text-red-400">
                {completedOverdueTasks} of {totalOverdueTasks} completed ({completionPercentage}%)
              </span>
            </div>
            <Progress 
              value={completionPercentage} 
              className="h-2 bg-red-100 dark:bg-red-950/30"
            />
          </div>
        )}

        {/* Tasks Grid or Empty State */}
        {hasOverdueTasks ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.slice(0, 6).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onStatusChange={onStatusChange}
                onClick={() => onEditTask(task)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <Calendar className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No overdue tasks
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Great job staying on top of your deadlines!
            </p>
            <Button onClick={onCreateTask} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create New Task
            </Button>
          </div>
        )}

        {/* Show count if more than 6 tasks */}
        {tasks.length > 6 && (
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              +{tasks.length - 6} more overdue task{tasks.length - 6 === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverdueTasksSection;
