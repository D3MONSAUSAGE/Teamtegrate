
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
    if (!task.deadline || !isValid(new Date(task.deadline))) {
      console.error('Invalid deadline date:', task.deadline);
      playErrorSound();
      toast.error('Invalid deadline date');
      return;
    }

    const now = new Date();
    const taskId = uuidv4();
    const formattedDeadline = task.deadline.toISOString();

    console.log('Creating new task with data:', {
      id: taskId,
      title: task.title,
      description: task.description,
      deadline: formattedDeadline,
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

    // First try creating the task in the project_tasks table (preferred)
    let success = false;
    let projectTaskData = null;
    
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .insert([taskData])
        .select('*');

      if (!error) {
        console.log('Task created successfully in project_tasks:', data);
        projectTaskData = data;
        success = true;
      } else {
        console.error('Error adding to project_tasks:', error);
      }
    } catch (err) {
      console.error('Exception when adding to project_tasks:', err);
    }

    // Fall back to legacy tasks table if project_tasks failed
    if (!success) {
      console.log('Falling back to legacy tasks table');
      const legacyTaskData = {
        ...taskData,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([legacyTaskData])
        .select('*');

      if (error) {
        console.error('Error adding task to legacy table:', error);
        playErrorSound();
        toast.error('Failed to create task');
        return;
      }

      console.log('Task created successfully in legacy table:', data);
      projectTaskData = data;
    }

    // Parse the deadline properly for local state update
    const deadlineDate = new Date(task.deadline);

    // Create new task object for state updates with correctly assigned user
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

    console.log('New task object for state update:', {
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
