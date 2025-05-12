
import { Task, DailyScore } from '@/types';
import { sub, format, isSameDay } from 'date-fns';

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
    if (!task.deadline) return false;
    
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return isSameDay(taskDate, today);
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

export const getTasksCompletionByDate = (tasks: Task[], days: number = 7): Array<{ date: Date; completed: number; total: number }> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const result = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = sub(today, { days: i });
    
    const dayTasks = tasks.filter(task => {
      if (!task.deadline) return false;
      
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return isSameDay(taskDate, date);
    });
    
    const completed = dayTasks.filter(task => task.status === 'Completed').length;
    
    result.push({
      date: new Date(date),
      completed,
      total: dayTasks.length
    });
  }
  
  return result;
};

export const getTasksCompletionByTeamMember = (tasks: Task[]): Array<{ name: string; completed: number; total: number }> => {
  const assignees: Record<string, { name: string; completed: number; total: number }> = {};
  
  tasks.forEach(task => {
    if (task.assignedToId && task.assignedToName) {
      if (!assignees[task.assignedToId]) {
        assignees[task.assignedToId] = {
          name: task.assignedToName,
          completed: 0,
          total: 0
        };
      }
      
      assignees[task.assignedToId].total++;
      
      if (task.status === 'Completed') {
        assignees[task.assignedToId].completed++;
      }
    }
  });
  
  return Object.values(assignees);
};

export const getProjectProgress = (tasks: Task[]): Array<{ projectId: string; status: string; count: number }> => {
  const projectTasks: Record<string, Record<string, number>> = {};
  
  tasks.forEach(task => {
    if (task.projectId) {
      if (!projectTasks[task.projectId]) {
        projectTasks[task.projectId] = {
          'To Do': 0,
          'In Progress': 0,
          'Pending': 0,
          'Completed': 0
        };
      }
      
      projectTasks[task.projectId][task.status]++;
    }
  });
  
  const result: Array<{ projectId: string; status: string; count: number }> = [];
  
  Object.entries(projectTasks).forEach(([projectId, statuses]) => {
    Object.entries(statuses).forEach(([status, count]) => {
      result.push({
        projectId,
        status,
        count
      });
    });
  });
  
  return result;
};
