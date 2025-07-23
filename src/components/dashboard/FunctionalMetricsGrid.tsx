
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle, AlertTriangle, Star } from 'lucide-react';
import { Task, DailyScore } from '@/types';
import { isTaskOverdue } from '@/utils/taskUtils';

interface FunctionalMetricsGridProps {
  tasks: Task[];
  dailyScore: DailyScore;
}

const FunctionalMetricsGrid: React.FC<FunctionalMetricsGridProps> = ({ tasks, dailyScore }) => {
  const completedToday = tasks.filter(task => {
    const today = new Date();
    const taskDate = new Date(task.updatedAt);
    return task.status === 'Completed' && 
           taskDate.toDateString() === today.toDateString();
  }).length;

  const overdueTasks = tasks.filter(task => isTaskOverdue(task)).length;
  const highPriorityTasks = tasks.filter(task => task.priority === 'High' && task.status !== 'Completed').length;

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* Daily Score */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-3">
          <Target className="h-5 w-5 text-purple-600 mr-2" />
          <h3 className="font-medium text-gray-900 dark:text-white">Daily Score</h3>
        </div>
        <div className="text-3xl font-bold text-purple-600 mb-2">
          {dailyScore.percentage}%
        </div>
        <Progress value={dailyScore.percentage} className="h-2 mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {dailyScore.completedTasks} of {dailyScore.totalTasks} completed
        </p>
      </div>

      {/* Completed Today */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-3">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <h3 className="font-medium text-gray-900 dark:text-white">Completed Today</h3>
        </div>
        <div className="text-3xl font-bold text-green-600 mb-2">
          {completedToday}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tasks finished today
        </p>
      </div>

      {/* Overdue Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="font-medium text-gray-900 dark:text-white">Overdue</h3>
        </div>
        <div className="text-3xl font-bold text-red-600 mb-2">
          {overdueTasks}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tasks past deadline
        </p>
      </div>

      {/* High Priority */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-3">
          <Star className="h-5 w-5 text-yellow-600 mr-2" />
          <h3 className="font-medium text-gray-900 dark:text-white">High Priority</h3>
        </div>
        <div className="text-3xl font-bold text-yellow-600 mb-2">
          {highPriorityTasks}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Important tasks pending
        </p>
      </div>
    </div>
  );
};

export default FunctionalMetricsGrid;
