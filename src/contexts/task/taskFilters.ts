
import { Task, Project, TaskStatus, TaskPriority } from '@/types';
import { isSameDay } from 'date-fns';

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

// Filter tasks by date - improved with isSameDay for more reliable comparison
export const getTasksByDate = (date: Date, tasks: Task[]): Task[] => {
  return tasks.filter(task => {
    if (!task.deadline) return false;
    
    const taskDate = new Date(task.deadline);
    return isSameDay(taskDate, date);
  });
};

// Get overdue tasks
export const getOverdueTasks = (tasks: Task[]): Task[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return tasks.filter(task => {
    if (task.status === 'Completed') return false;
    
    const deadlineDate = new Date(task.deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  });
};
