
import { Task, Project, TaskStatus, TaskPriority } from '@/types';
import { isSameDay, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

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
  console.log(`Filtering tasks for date ${date.toISOString().split('T')[0]}`);
  
  return tasks.filter(task => {
    if (!task.deadline) {
      console.log(`Task ${task.id} has no deadline`);
      return false;
    }
    
    // Ensure we're working with Date objects
    const taskDate = task.deadline instanceof Date ? task.deadline : new Date(task.deadline);
    
    // Use isSameDay for reliable date comparison regardless of time component
    const matches = isSameDay(taskDate, date);
    
    if (matches) {
      console.log(`Task "${task.title}" (${task.id}) matches date ${date.toISOString().split('T')[0]}`);
    }
    
    return matches;
  });
};

// Get today's tasks - dedicated helper for dashboard
export const getTodaysTasks = (tasks: Task[]): Task[] => {
  const today = new Date();
  console.log(`Getting today's tasks (${today.toISOString().split('T')[0]}), total tasks: ${tasks.length}`);
  
  const todayTasks = tasks.filter(task => {
    if (!task.deadline) return false;
    
    // Ensure we're working with Date objects
    const deadline = task.deadline instanceof Date ? task.deadline : new Date(task.deadline);
    
    // Use isSameDay for reliable comparison
    const isToday = isSameDay(deadline, today);
    
    if (isToday) {
      console.log(`Task "${task.title}" (${task.id}) due today`);
    }
    
    return isToday;
  });
  
  console.log(`Found ${todayTasks.length} tasks for today`);
  return todayTasks;
};

// Get overdue tasks
export const getOverdueTasks = (tasks: Task[]): Task[] => {
  const today = startOfDay(new Date());
  
  return tasks.filter(task => {
    if (task.status === 'Completed') return false;
    
    // Handle potential string dates
    const deadline = task.deadline instanceof Date ? task.deadline : new Date(task.deadline);
    
    // Set deadline to start of day for fair comparison
    const deadlineDay = startOfDay(deadline);
    return deadlineDay < today;
  });
};

// Get tasks for the next N days (excluding today)
export const getUpcomingTasks = (tasks: Task[], daysAhead = 7): Task[] => {
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + daysAhead);
  
  // Set time to end of day
  endDate.setHours(23, 59, 59, 999);
  
  // Start from tomorrow
  const startDate = new Date();
  startDate.setDate(today.getDate() + 1);
  startDate.setHours(0, 0, 0, 0);
  
  return tasks.filter(task => {
    if (!task.deadline) return false;
    
    // Handle potential string dates
    const deadline = task.deadline instanceof Date ? task.deadline : new Date(task.deadline);
    
    return isWithinInterval(deadline, { start: startDate, end: endDate });
  });
};
