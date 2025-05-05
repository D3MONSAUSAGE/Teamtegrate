
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
    if (!task.deadline) return false;
    
    const taskDate = safeParseDate(task.deadline);
    if (!taskDate) return false;
    
    // Consider a task as due on a date if it falls anywhere within that date
    return (taskDate >= targetDate && taskDate <= targetEndOfDay);
  });
};

// Get tasks scheduled for today - completely rewritten for reliability
export const getTodaysTasks = (tasks: Task[]): Task[] => {
  if (!tasks || tasks.length === 0) {
    console.log("No tasks provided to getTodaysTasks");
    return [];
  }
  
  console.log(`Filtering today's tasks from ${tasks.length} total tasks`);
  
  // Create exact start and end of today for comparison
  const now = new Date();
  const startToday = startOfDay(now);
  const endToday = endOfDay(now);
  
  // Log date boundaries for debugging
  console.log(`Today's boundaries: ${startToday.toISOString()} to ${endToday.toISOString()}`);
  
  const todaysTasks = tasks.filter(task => {
    // Skip tasks without deadlines
    if (!task.deadline) {
      return false;
    }
    
    try {
      // Handle all possible date formats
      let deadlineDate: Date;
      
      if (task.deadline instanceof Date) {
        deadlineDate = task.deadline;
      } else if (typeof task.deadline === 'string') {
        deadlineDate = new Date(task.deadline);
      } else {
        console.log(`Skipping task with invalid deadline type: ${typeof task.deadline}`);
        return false;
      }
      
      // Safety check for validity
      if (!isValid(deadlineDate)) {
        console.log(`Skipping task with invalid date: ${task.title}`);
        return false;
      }
      
      // Check if task falls within today's boundaries
      const isTaskToday = (deadlineDate >= startToday && deadlineDate <= endToday);
      
      if (isTaskToday) {
        console.log(`Task due today: "${task.title}" (${deadlineDate.toISOString()})`);
      }
      
      return isTaskToday;
    } catch (error) {
      console.error(`Error processing task deadline for "${task.title}":`, error);
      return false;
    }
  });
  
  console.log(`Found ${todaysTasks.length} tasks due today`);
  return todaysTasks;
};

// Get overdue tasks - with improved validation
export const getOverdueTasks = (tasks: Task[]): Task[] => {
  if (!tasks || tasks.length === 0) return [];
  
  const today = startOfDay(new Date());
  
  return tasks.filter(task => {
    if (task.status === 'Completed') return false;
    if (!task.deadline) return false;
    
    try {
      let deadlineDate: Date;
      
      if (task.deadline instanceof Date) {
        deadlineDate = task.deadline;
      } else if (typeof task.deadline === 'string') {
        deadlineDate = new Date(task.deadline);
      } else {
        return false;
      }
      
      if (!isValid(deadlineDate)) return false;
      
      return startOfDay(deadlineDate) < today;
    } catch (error) {
      console.error(`Error processing overdue task "${task.title}":`, error);
      return false;
    }
  });
};
