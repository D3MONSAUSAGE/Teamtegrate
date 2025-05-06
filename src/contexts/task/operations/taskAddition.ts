
import { Task, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '@/types';
import { format } from 'date-fns';

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
      return;
    }
    
    // Ensure we have a valid string user ID
    const userId = typeof user.id === 'string' ? user.id : String(user.id);

    const now = new Date();
    const taskId = uuidv4();

    // Make sure deadline is a valid date object
    const deadline = task.deadline instanceof Date ? task.deadline : new Date(task.deadline);
    
    console.log('Creating new task with deadline:', format(deadline, 'yyyy-MM-dd HH:mm:ss'));
    console.log('Task creator user ID:', userId);

    const taskToInsert = {
      id: taskId,
      user_id: userId,
      project_id: task.projectId || null,
      title: task.title,
      description: task.description,
      deadline: deadline.toISOString(),
      priority: task.priority,
      status: task.status,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      assigned_to_id: task.assignedToId || null,
    };

    console.log('Inserting task with data:', JSON.stringify(taskToInsert));

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskToInsert)
      .select('*')
      .single();

    if (error) {
      console.error('Error adding task:', error);
      
      // Try project_tasks table as fallback
      console.log('Attempting to insert into project_tasks table instead...');
      const { data: projectTasksData, error: projectTasksError } = await supabase
        .from('project_tasks')
        .insert(taskToInsert)
        .select('*')
        .single();
        
      if (projectTasksError) {
        console.error('Error adding task to project_tasks:', projectTasksError);
        playErrorSound();
        toast.error('Failed to create task');
        return;
      }
      
      if (!projectTasksData) {
        console.error('No data returned when inserting task');
        playErrorSound();
        toast.error('Failed to create task');
        return;
      }
      
      // Use the data from project_tasks
      data = projectTasksData;
    }

    if (data) {
      // Construct a properly formatted Task object with ALL required properties
      const newTask: Task = {
        id: data.id,
        userId: userId, // Use normalized user ID
        projectId: data.project_id || undefined,
        title: data.title || '',
        description: data.description || '',
        deadline: new Date(data.deadline || now),
        priority: (data.priority as Task['priority']) || 'Medium',
        status: (data.status as Task['status']) || 'To Do',
        createdAt: new Date(data.created_at || now),
        updatedAt: new Date(data.updated_at || now),
        assignedToId: data.assigned_to_id || undefined,
        assignedToName: task.assignedToName,
        tags: [],
        comments: [],
        cost: data.cost || 0,
      };

      console.log('Task created successfully, updating state with new task:', newTask);
      console.log('Task deadline:', format(newTask.deadline, 'yyyy-MM-dd'));
      
      // Update the tasks state with the new task
      setTasks(prevTasks => {
        const updatedTasks = [...prevTasks, newTask];
        console.log(`Tasks updated: ${updatedTasks.length} (previous: ${prevTasks.length})`);
        return updatedTasks;
      });
      
      // Update the project's tasks if needed
      if (newTask.projectId) {
        setProjects(prevProjects => 
          prevProjects.map(project => {
            if (project.id === newTask.projectId) {
              return {
                ...project,
                tasks: [...(project.tasks || []), newTask]
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
