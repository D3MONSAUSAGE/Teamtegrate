
import { Project, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';
import { v4 as uuidv4 } from 'uuid';
import { ProjectInput } from '../../TaskContext';
import { formatNewProjectTasks } from '../projectUtils';

export const addProject = async (
  project: ProjectInput,
  user: User | null,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    const now = new Date();
    const projectId = uuidv4();

    const projectToInsert = {
      id: projectId,
      manager_id: user.id,
      title: project.title,
      description: project.description,
      start_date: project.startDate.toISOString(),
      end_date: project.endDate.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      budget: project.budget || null,
      is_completed: false,
      budget_spent: 0
    };

    const { error } = await supabase
      .from('projects')
      .insert(projectToInsert);

    if (error) {
      console.error('Error adding project:', error);
      playErrorSound();
      toast.error('Failed to create project');
      return;
    }

    if (project.tasks && project.tasks.length > 0) {
      const tasksToInsert = project.tasks.map(task => ({
        id: uuidv4(),
        user_id: user.id,
        project_id: projectId,
        title: task.title,
        description: task.description,
        deadline: task.deadline.toISOString(),
        priority: task.priority,
        status: task.status,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }));

      const { error: tasksError } = await supabase
        .from('project_tasks')
        .insert(tasksToInsert);

      if (tasksError) {
        console.error('Error adding project tasks:', tasksError);
        toast.error('Project created but failed to add tasks');
      }
    }

    setProjects(prevProjects => {
      const formattedTasks = formatNewProjectTasks(project.tasks || [], user.id, projectId, now);
      
      const newProject: Project = {
        id: projectId,
        title: project.title,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
        managerId: user.id,
        createdAt: now,
        updatedAt: now,
        tasks: formattedTasks,
        teamMembers: project.teamMembers || [],
        tags: [],
        budget: project.budget,
        budgetSpent: 0,
        is_completed: false
      };

      return [...prevProjects, newProject];
    });

    playSuccessSound();
    toast.success('Project created successfully!');
  } catch (error) {
    console.error('Error in addProject:', error);
    playErrorSound();
    toast.error('Failed to create project');
  }
};
