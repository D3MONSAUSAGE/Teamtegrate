
import { Task, Project, TaskStatus, TaskPriority } from '@/types';
import { isToday, isSameDay, startOfDay } from 'date-fns';

// Filter tasks by tag
export const getTasksWithTag = (tag: string, tasks: Task[]): Task[] => {
  return tasks.filter(task => task.tags && task.tags.includes(tag));
};

// Filter projects by tag
export const getProjectsWithTag = (tag: string, projects: Project[]): Project[] => {
  return projects.filter(project => project.tags && project.tags.includes(tag));
};

// Filter tasks by status
export const getTasksByStatus = (status: TaskStatus, tasks: Task[]): Task[] => {
  return tasks.filter(task => task.status === status);
};

// Filter tasks by priority
export const getTasksByPriority = (priority: TaskPriority, tasks: Task[]): Task[] => {
  return tasks.filter(task => task.priority === priority);
};

// Filter tasks by date - improved to handle time zones better
export const getTasksByDate = (date: Date, tasks: Task[]): Task[] => {
  const targetDate = startOfDay(date);
  
  return tasks.filter(task => {
    try {
      const taskDate = new Date(task.deadline);
      return isSameDay(taskDate, targetDate);
    } catch (error) {
      console.error("Invalid date in task:", task.id);
      return false;
    }
  });
};

// Get tasks scheduled for today
export const getTodaysTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task => {
    try {
      const taskDate = new Date(task.deadline);
      return isToday(taskDate);
    } catch (error) {
      console.error("Invalid date in task:", task.id);
      return false;
    }
  });
};

// Get overdue tasks
export const getOverdueTasks = (tasks: Task[]): Task[] => {
  const today = startOfDay(new Date());
  
  return tasks.filter(task => {
    if (task.status === 'Completed') return false;
    
    try {
      const deadlineDate = startOfDay(new Date(task.deadline));
      return deadlineDate < today;
    } catch (error) {
      console.error("Invalid date in task:", task.id);
      return false;
    }
  });
};
