
import { Task, User } from '@/types';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';
import { Project } from '@/types';
import { normalizeTaskData } from '../utils/taskDataNormalizer';
import { insertTaskRecord } from '../utils/taskInsert';
import { updateStateWithNewTask } from '../utils/taskStateUpdater';

/**
 * Ensures a user ID is a valid string
 */
const normalizeUserId = (userId: string | { id: string } | null): string | null => {
  if (!userId) return null;
  if (typeof userId === 'string') return userId;
  if (typeof userId === 'object' && userId !== null && 'id' in userId) {
    return typeof userId.id === 'string' ? userId.id : String(userId.id);
  }
  return null;
};

/**
 * Validates and normalizes a date object
 */
const normalizeDate = (date: Date | string | undefined): Date => {
  if (!date) return new Date();
  
  try {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    // Check if date is valid
    if (isNaN(parsedDate.getTime())) {
      console.warn(`Invalid date: "${date}", using current date instead`);
      return new Date();
    }
    return parsedDate;
  } catch (error) {
    console.warn(`Error parsing date: "${date}", using current date instead:`, error);
    return new Date();
  }
};

export const addTask = async (
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    // Validate user
    const userId = normalizeUserId(user?.id);
    if (!userId) {
      console.error('Cannot add task: No valid user ID provided');
      playErrorSound();
      toast.error('User information is required to create a task');
      return null;
    }
    
    // Log the incoming task data for debugging
    console.log('Adding task with data:', { 
      ...task,
      deadline: task.deadline ? new Date(task.deadline).toISOString() : null,
      assignedToId: task.assignedToId || 'none',
      assignedToName: task.assignedToName || 'none'
    });
    
    // Normalize and validate the deadline
    const normalizedDeadline = normalizeDate(task.deadline);
    
    // Create a normalized task object with validated fields
    const normalizedTask = {
      ...task,
      deadline: normalizedDeadline,
      userId: userId
    };
    
    // Insert the task into the database
    const { data, error, table } = await insertTaskRecord(normalizedTask, userId);

    if (error) {
      console.error(`Failed to add task to ${table} table:`, error);
      playErrorSound();
      toast.error('Failed to create task: ' + (error.message || 'Unknown error'));
      return null;
    }

    if (!data) {
      console.error('No data returned when inserting task');
      playErrorSound();
      toast.error('Failed to create task: No data returned from database');
      return null;
    }

    // Log the returned data from database
    console.log('Task created successfully, returned data:', data);
    
    // Normalize task data from database format to app format
    const newTask = normalizeTaskData(data, userId, task.assignedToName);
    
    // Log assignment data for the new task
    console.log('New task assignment data:', {
      assignedToId: newTask.assignedToId,
      assignedToName: newTask.assignedToName,
      fromDb: {
        assigned_to_id: data.assigned_to_id,
      }
    });
    
    // Update state with the new task
    updateStateWithNewTask(newTask, setTasks, setProjects);
    
    playSuccessSound();
    toast.success('Task created successfully!');
    return newTask;
  } catch (error) {
    console.error('Error in addTask:', error);
    playErrorSound();
    toast.error('Failed to create task: ' + ((error as Error)?.message || 'Unknown error'));
    return null;
  }
};
