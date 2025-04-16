
import { Task, DailyScore } from '@/types';

export const calculateDailyScore = (tasks: Task[]): DailyScore => {
  if (!tasks.length) {
    return {
      completedTasks: 0,
      totalTasks: 0,
      percentage: 0,
      date: new Date(),
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaysTasks = tasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });

  const completed = todaysTasks.filter((task) => task.status === 'Completed').length;
  const total = todaysTasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    completedTasks: completed,
    totalTasks: total,
    percentage,
    date: today,
  };
};
