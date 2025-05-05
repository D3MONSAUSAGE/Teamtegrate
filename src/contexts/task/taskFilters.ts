
import { Task, Project, TaskStatus, TaskPriority } from '@/types';
import { isToday, isSameDay, startOfDay, parseISO, isValid, endOfDay, isAfter, isBefore } from 'date-fns';

// Helper function to safely parse date strings
const safeParseDate = (dateStr: string | Date): Date | null => {
  if (!dateStr) return null;
  
  try {
    // If it's already a Date object
    if (dateStr instanceof Date) {
      return isValid(dateStr) ? dateStr : null;
    }
    
    // Try to parse the string as a date
    const parsedDate = parseISO(dateStr.toString());
    return isValid(parsedDate) ? parsedDate : null;
  } catch (error) {
    console.error("Error parsing date:", dateStr, error);
    return null;
  }
};

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

// Filter tasks by date - improved to handle time zones and invalid dates better
export const getTasksByDate = (date: Date, tasks: Task[]): Task[] => {
  if (!date || !isValid(date)) return [];
  
  const targetDate = startOfDay(date);
  const targetEndOfDay = endOfDay(date);
  
  return tasks.filter(task => {
    const taskDate = safeParseDate(task.deadline);
    if (!taskDate) return false;
    
    // Consider a task as due on a date if it falls anywhere within that date
    return taskDate >= targetDate && taskDate <= targetEndOfDay;
  });
};

// Get tasks scheduled for today - with improved validation
export const getTodaysTasks = (tasks: Task[]): Task[] => {
  console.log(`Filtering today's tasks from ${tasks.length} total tasks`);
  const today = new Date();
  const startToday = startOfDay(today);
  const endToday = endOfDay(today);
  
  const todaysTasks = tasks.filter(task => {
    if (!task.deadline) return false;
    
    const taskDate = safeParseDate(task.deadline);
    if (!taskDate) return false;
    
    // Check if task deadline falls within today (between start and end of today)
    const isTaskToday = taskDate >= startToday && taskDate <= endToday;
    
    if (isTaskToday) {
      console.log(`Task "${task.title}" (${taskDate.toISOString()}) is due today`);
    }
    
    return isTaskToday;
  });
  
  console.log(`Found ${todaysTasks.length} tasks due today`);
  return todaysTasks;
};

// Get overdue tasks - with improved validation
export const getOverdueTasks = (tasks: Task[]): Task[] => {
  const today = startOfDay(new Date());
  
  return tasks.filter(task => {
    if (task.status === 'Completed') return false;
    if (!task.deadline) return false;
    
    const taskDate = safeParseDate(task.deadline);
    if (!taskDate) return false;
    
    return startOfDay(taskDate) < today;
  });
};
