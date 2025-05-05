
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';
import { isValid, format } from 'date-fns';

export const addTask = async (
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  user: { id: string } | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>>
): Promise<void> => {
  try {
    if (!user) {
      console.error('No user found when creating task');
      playErrorSound();
      toast.error('Please log in to create tasks');
      return;
    }

    // Validate the deadline date
    if (!task.deadline) {
      console.error('Missing deadline date');
      playErrorSound();
      toast.error('Please specify a deadline date');
      return;
    }

    let deadlineDate: Date;
    
    // Handle different deadline formats
    if (task.deadline instanceof Date) {
      deadlineDate = task.deadline;
    } else if (typeof task.deadline === 'string') {
      deadlineDate = new Date(task.deadline);
    } else {
      console.error('Invalid deadline type:', typeof task.deadline);
      playErrorSound();
      toast.error('Invalid deadline format');
      return;
    }
    
    if (!isValid(deadlineDate)) {
      console.error('Invalid deadline date:', task.deadline);
      playErrorSound();
      toast.error('Invalid deadline date');
      return;
    }

    const now = new Date();
    const taskId = uuidv4();
    
    // Format deadline as ISO string for database storage
    const formattedDeadline = deadlineDate.toISOString();

    console.log('Creating new task with data:', {
      id: taskId,
      title: task.title,
      description: task.description,
      deadline: formattedDeadline,
      deadlineReadable: format(deadlineDate, 'yyyy-MM-dd HH:mm:ss'),
      priority: task.priority,
      projectId: task.projectId,
      assignedToId: task.assignedToId,
      assignedToName: task.assignedToName
    });

    // Create task data for insertion
    const taskData = {
      id: taskId,
      project_id: task.projectId || null,
      title: task.title,
      description: task.description || '',
      deadline: formattedDeadline,
      priority: task.priority,
      status: task.status,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      assigned_to_id: task.assignedToId || null,
      cost: task.cost || 0,
    };

    // Try creating the task in the database
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select('*');

    if (error) {
      console.error('Error adding task:', error);
      playErrorSound();
      toast.error('Failed to create task');
      return;
    }

    // Create new task object for state updates
    const newTask: Task = {
      id: taskId,
      userId: user.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description || '',
      deadline: deadlineDate,
      priority: task.priority,
      status: task.status,
      createdAt: now,
      updatedAt: now,
      assignedToId: task.assignedToId,
      assignedToName: task.assignedToName, 
      tags: [],
      comments: [],
      cost: task.cost || 0,
    };

    console.log('Task created successfully, updating state with:', {
      id: newTask.id,
      title: newTask.title,
      deadline: format(deadlineDate, 'yyyy-MM-dd HH:mm:ss'),
      assignedToId: newTask.assignedToId,
      assignedToName: newTask.assignedToName
    });

    // Update local state
    setTasks(prevTasks => [...prevTasks, newTask]);

    // If the task is associated with a project, update that project's task list
    if (task.projectId) {
      setProjects(prevProjects =>
        prevProjects.map(project =>
          project.id === task.projectId
            ? { 
                ...project, 
                tasks: [...(project.tasks || []), newTask],
                tasks_count: (project.tasks_count || 0) + 1
              }
            : project
        )
      );
    }

    playSuccessSound();
    toast.success('Task created successfully!');
  } catch (error) {
    console.error('Error in addTask:', error);
    playErrorSound();
    toast.error('Failed to create task');
  }
};
