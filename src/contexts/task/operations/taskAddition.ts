
import { Task, User } from '@/types';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';
import { Project } from '@/types';
import { normalizeTaskData } from '../utils/taskDataNormalizer';
import { insertTaskRecord } from '../utils/taskInsert';
import { updateStateWithNewTask } from '../utils/taskStateUpdater';

export const addTask = async (
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) {
      console.error('Cannot add task: No user provided');
      playErrorSound();
      toast.error('User information is required to create a task');
      return;
    }
    
    // Ensure we have a valid string user ID
    const userId = typeof user.id === 'string' ? user.id : String(user.id);

    // Insert the task into the database
    const { data, error, table } = await insertTaskRecord(task, userId);

    if (error) {
      console.error(`Failed to add task to ${table} table:`, error);
      playErrorSound();
      toast.error('Failed to create task: ' + (error.message || 'Unknown error'));
      return;
    }

    if (!data) {
      console.error('No data returned when inserting task');
      playErrorSound();
      toast.error('Failed to create task: No data returned from database');
      return;
    }

    // Normalize task data from database format to app format
    const newTask = normalizeTaskData(data, userId, task.assignedToName);
    
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
