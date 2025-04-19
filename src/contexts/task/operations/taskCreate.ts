
import { playSuccessSound, playErrorSound } from '@/utils/sounds';
import { User, Project, Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';
import { updateTaskInProjects } from '../utils';
import { fetchTeamMemberName } from '../api/team';

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

    console.log('Adding task with project:', task.projectId);

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
      cost: task.cost || 0
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskToInsert)
      .select('*')
      .single();

    if (error) {
      console.error('Error adding task:', error);
      playErrorSound();
      toast.error('Failed to create task');
      return;
    }

    if (data) {
      // Fetch assignee name if needed
      let assigneeName = task.assignedToName;
      if (data.assigned_to_id && !assigneeName) {
        assigneeName = await fetchTeamMemberName(data.assigned_to_id);
      }
      
      const newTask: Task = {
        id: data.id,
        userId: data.user_id,
        projectId: data.project_id || undefined,
        title: data.title,
        description: data.description,
        deadline: new Date(data.deadline),
        priority: data.priority as Task['priority'],
        status: data.status as Task['status'],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        assignedToId: data.assigned_to_id || undefined,
        assignedToName: assigneeName,
        tags: [],
        comments: [],
        cost: data.cost || 0
      };

      setTasks(prevTasks => [...prevTasks, newTask]);
      
      if (task.projectId) {
        setProjects(prevProjects => prevProjects.map(project => {
          if (project.id === task.projectId) {
            const updatedTasks = [...(project.tasks || []), newTask];
            return {
              ...project,
              tasks: updatedTasks
            };
          }
          return project;
        }));
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
