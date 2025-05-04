
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
