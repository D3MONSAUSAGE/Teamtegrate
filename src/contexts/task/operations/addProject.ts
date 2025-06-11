
import { User, Project, ProjectStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

export const addProject = async (
  project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>,
  user: User | null,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
): Promise<Project | null> => {
  try {
    if (!user || !user.organization_id) {
      toast.error('You must be logged in and belong to an organization to create a project');
      return null;
    }
    
    const now = new Date();
    const projectId = uuidv4();
    const nowISO = now.toISOString();
    
    console.log('Creating project with user ID:', user.id, 'organization:', user.organization_id, 'project:', project);
    
    // Prepare budget value - handle undefined or null case
    const budget = project.budget ?? 0; // Use nullish coalescing to default to 0 if undefined or null
    
    // Prepare project data for insertion with fallback values
    const projectToInsert = {
      id: projectId,
      title: project.title || 'Untitled Project',
      description: project.description || '',
      start_date: project.startDate?.toISOString() || nowISO,
      end_date: project.endDate?.toISOString() || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      manager_id: user.id, // Set current user as manager
      created_at: nowISO,
      updated_at: nowISO,
      budget: budget, // Using the prepared value
      is_completed: project.is_completed || false,
      budget_spent: 0,
      team_members: project.teamMembers || [],
      status: project.status || 'To Do',
      tasks_count: 0,
      tags: project.tags || [],
      organization_id: user.organization_id // Add the required organization_id
    };

    // Insert into Supabase
    const { error: projectError } = await supabase
      .from('projects')
      .insert(projectToInsert);

    if (projectError) {
      console.error('Error adding project:', projectError);
      playErrorSound();
      toast.error('Failed to create project. Please try again.');
      return null;
    }

    // Create local project object for state update
    const newProject: Project = {
      id: projectId,
      title: project.title || 'Untitled Project',
      description: project.description || '',
      startDate: project.startDate || now,
      endDate: project.endDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      managerId: user.id,
      createdAt: now,
      updatedAt: now,
      tasks: [],
      teamMembers: project.teamMembers || [],
      budget: budget, // Using the prepared value
      budgetSpent: 0,
      is_completed: project.is_completed || false,
      status: (project.status || 'To Do') as ProjectStatus,
      tasks_count: 0,
      tags: project.tags || []
    };

    // Update local state
    setProjects(prevProjects => [...prevProjects, newProject]);
    playSuccessSound();
    toast.success('Project created successfully!');
    
    return newProject;
  } catch (error) {
    console.error('Error in addProject:', error);
    playErrorSound();
    toast.error('Failed to create project');
    return null;
  }
};
