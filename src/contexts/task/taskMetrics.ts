
import { Task, DailyScore } from '@/types';

export const calculateDailyScore = (tasks: Task[]): DailyScore => {
  // Get today's date with time set to midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get tomorrow's date
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Filter tasks due today
  const todaysTasks = tasks.filter(task => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });
  
  // Count completed tasks
  const completedTasks = todaysTasks.filter(task => task.status === 'Completed').length;
  const totalTasks = todaysTasks.length;
  
  // Calculate percentage
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  return {
    completedTasks,
    totalTasks,
    percentage,
    date: today
  };
};

/**
 * Gets task completion data for a specific number of days
 * @param tasks Array of tasks
 * @param days Number of past days to include
 * @returns Array of daily completion data
 */
export const getTasksCompletionByDate = (tasks: Task[], days: number = 14) => {
  const result = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Generate data for each day in the range
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Set the date to midnight for accurate comparison
    date.setHours(0, 0, 0, 0);
    
    // Filter tasks for the specific date
    const dateTasks = tasks.filter(task => {
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === date.getTime();
    });
    
    // Count completed tasks
    const completed = dateTasks.filter(task => task.status === 'Completed').length;
    const total = dateTasks.length;
    
    result.push({
      date,
      completed,
      total
    });
  }
  
  return result;
};
