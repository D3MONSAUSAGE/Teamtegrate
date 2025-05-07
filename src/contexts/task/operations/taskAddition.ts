
import { Task, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '@/types';

export const addTask = async (
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    const now = new Date();
    const taskId = uuidv4();

    // Log the assignedToName for debugging
    console.log(`Creating task with assignedToName: ${task.assignedToName || 'none'}`);

    const taskToInsert = {
      id: taskId,
      user_id: user.id,
      project_id: task.projectId || null,
      title: task.title,
      description: task.description,
      deadline: task.deadline.toISOString(),
      priority: task.priority,
      status: task.status,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      assigned_to_id: task.assignedToId || null,
      assigned_to_name: task.assignedToName || null,
      cost: task.cost || 0
    };

    // Declare a variable to hold our result that we can modify
    let result;

    // First attempt with assigned_to_name included
    result = await supabase
      .from('tasks')
      .insert(taskToInsert)
      .select('*')
      .single();

    // If error occurs and it's related to assigned_to_name field
    if (result.error && result.error.message.includes('assigned_to_name')) {
      console.log('Detected assigned_to_name field error, retrying without it');
      
      // Create a new object without the assigned_to_name field
      const { assigned_to_name, ...taskWithoutName } = taskToInsert;
      
      // Second attempt without the assigned_to_name field
      result = await supabase
        .from('tasks')
        .insert(taskWithoutName)
        .select('*')
        .single();
        
      if (result.error) {
        console.error('Error on retry:', result.error);
        playErrorSound();
        toast.error('Failed to create task');
        return;
      }
    } else if (result.error) {
      // Handle other types of errors
      console.error('Error adding task:', result.error);
      playErrorSound();
      toast.error('Failed to create task');
      return;
    }

    // At this point, result.data should be available if no errors occurred
    if (result.data) {
      const taskData = result.data;
      
      // Store the original assignedToName for debugging
      const originalAssignedToName = task.assignedToName;
      
      console.log(`Task created - Original name: ${originalAssignedToName || 'none'}`);
      
      const newTask: Task = {
        id: taskData.id,
        userId: taskData.user_id || user.id,
        projectId: taskData.project_id || undefined,
        title: taskData.title || '',
        description: taskData.description || '',
        deadline: new Date(taskData.deadline || now),
        priority: (taskData.priority as Task['priority']) || 'Medium',
        status: (taskData.status as Task['status']) || 'To Do',
        createdAt: new Date(taskData.created_at || now),
        updatedAt: new Date(taskData.updated_at || now),
        assignedToId: taskData.assigned_to_id || undefined,
        // Use original task's assignedToName since it may not be in the database
        assignedToName: task.assignedToName,
        tags: [],
        comments: [],
        cost: taskData.cost || 0,
      };

      setTasks(prevTasks => [...prevTasks, newTask]);
      
      if (newTask.projectId) {
        setProjects(prevProjects => 
          prevProjects.map(project => {
            if (project.id === newTask.projectId) {
              return {
                ...project,
                tasks: [...project.tasks, newTask]
              };
            }
            return project;
          })
        );
      }
      
      playSuccessSound();
      toast.success('Task created successfully!');
    }
  } catch (error) {
    console.error('Error in addTask:', error);
    playErrorSound();
    toast.error('Failed to create task');
  }
};
