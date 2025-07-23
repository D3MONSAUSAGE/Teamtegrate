
import React from 'react';
import { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { isTaskOverdue } from '@/utils/taskUtils';

interface TodaysTasksListProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const TodaysTasksList: React.FC<TodaysTasksListProps> = ({ tasks, onTaskClick }) => {
  const today = new Date();
  const todaysTasks = tasks.filter(task => {
    const taskDate = new Date(task.deadline);
    return taskDate.toDateString() === today.toDateString();
  });

  const overdueTasks = tasks.filter(task => isTaskOverdue(task));
  const displayTasks = [...todaysTasks, ...overdueTasks.slice(0, 3)].slice(0, 5);

  const getTaskIcon = (task: Task) => {
    if (task.status === 'Completed') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (isTaskOverdue(task)) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    return <Clock className="h-4 w-4 text-blue-600" />;
  };

  const getTaskColor = (task: Task) => {
    if (task.status === 'Completed') return 'text-green-600';
    if (isTaskOverdue(task)) return 'text-red-600';
    return 'text-gray-900 dark:text-white';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Today's Tasks & Overdue
      </h3>
      
      {displayTasks.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 text-center py-4">
          No tasks for today. Great job!
        </p>
      ) : (
        <div className="space-y-3">
          {displayTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              onClick={() => onTaskClick(task)}
            >
              <div className="flex items-center flex-1">
                {getTaskIcon(task)}
                <div className="ml-3 flex-1">
                  <p className={`font-medium ${getTaskColor(task)}`}>
                    {task.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {task.priority} priority
                    {isTaskOverdue(task) && ' • Overdue'}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(task.deadline).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodaysTasksList;
