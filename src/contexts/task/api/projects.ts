
import { Project, User, ProjectStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

export const fetchProjects = async (
  user: { id: string },
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
): Promise<void> => {
  try {
    if (!user) {
      console.log('No user found, skipping projects fetch');
      setProjects([]);
      return;
    }

    console.log('Fetching projects for user:', user.id);
    
    // First attempt with OR condition
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .or(`manager_id.eq.${user.id},team_members.cs.{${user.id}}`)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} projects with OR condition`);
      processProjectData(data, user, setProjects);
    } catch (error) {
      console.error('Error fetching projects with OR condition:', error);
      
      // Fall back to separate queries
      try {
        // Get projects where user is manager
        const { data: managerProjects, error: managerError } = await supabase
          .from('projects')
          .select('*')
          .eq('manager_id', user.id)
          .order('created_at', { ascending: false });

        if (managerError) {
          console.error('Error fetching manager projects:', managerError);
        }
        
        // Get projects where user is team member
        const { data: teamProjects, error: teamError } = await supabase
          .from('projects')
          .select('*')
          .contains('team_members', [user.id])
          .order('created_at', { ascending: false });

        if (teamError) {
          console.error('Error fetching team projects:', teamError);
        }
        
        // Combine and deduplicate
        const allProjects = [
          ...(managerProjects || []), 
          ...(teamProjects || [])
        ];
        
        // Deduplicate by project id
        const uniqueProjects = Array.from(
          new Map(allProjects.map(project => [project.id, project])).values()
        );
        
        console.log(`Fetched ${uniqueProjects.length} projects using separate queries`);
        processProjectData(uniqueProjects, user, setProjects);
      } catch (fallbackError) {
        console.error('Error in fallback project fetching:', fallbackError);
        toast.error('Failed to load projects');
        setProjects([]);
      }
    }
  } catch (error) {
    console.error('Error in fetchProjects:', error);
    toast.error('Failed to load projects');
    setProjects([]);
  }
};

// Helper function to process project data
const processProjectData = (
  data: any[] | null,
  user: { id: string },
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  if (!data || data.length === 0) {
    console.log('No projects found in database');
    setProjects([]);
    return;
  }
  
  // Log received projects for debugging
  data.forEach(project => {
    console.log(`Found project: ${project.id}, "${project.title}", Manager: ${project.manager_id}`);
  });

  const formattedProjects: Project[] = data.map(project => {
    // Explicitly ensure status and is_completed are synchronized
    let status = project.status || 'To Do';
    let isCompleted = project.is_completed || false;
    
    // Always enforce consistency between status and is_completed
    if (status === 'Completed') {
      isCompleted = true;
    } else if (isCompleted) {
      status = 'Completed';
    }
    
    return {
      id: project.id,
      title: project.title || '',
      description: project.description || '',
      startDate: project.start_date ? new Date(project.start_date) : new Date(),
      endDate: project.end_date ? new Date(project.end_date) : new Date(),
      managerId: project.manager_id || user.id,
      createdAt: project.created_at ? new Date(project.created_at) : new Date(),
      updatedAt: project.updated_at ? new Date(project.updated_at) : new Date(),
      tasks: [],
      teamMembers: project.team_members || [],
      budget: project.budget || 0,
      is_completed: isCompleted,
      budgetSpent: project.budget_spent || 0,
      status: status as ProjectStatus,
      tasks_count: project.tasks_count || 0,
      tags: project.tags || []
    };
  });

  console.log('Formatted projects:', formattedProjects);
  setProjects(formattedProjects);
};

export const addProject = async (
  project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>,
  user: { id: string }
): Promise<Project | null> => {
  try {
    // Generate a unique ID for the project
    const projectId = uuidv4();
    const now = new Date();
    const nowISO = now.toISOString();
    
    // Explicitly ensure status and is_completed are synchronized
    let status = project.status || 'To Do';
    let isCompleted = project.is_completed || false;
    
    // Always enforce consistency
    if (status === 'Completed') {
      isCompleted = true;
    } else if (isCompleted) {
      status = 'Completed';
    }
    
    console.log('Creating project:', {
      id: projectId,
      title: project.title,
      description: project.description,
      start_date: project.startDate.toISOString(),
      end_date: project.endDate.toISOString(),
      manager_id: user.id,
      budget: project.budget || 0,
      is_completed: isCompleted,
      status: status,
      tasks_count: 0,
      tags: project.tags || []
    });
    
    const { error } = await supabase
      .from('projects')
      .insert({
        id: projectId,
        title: project.title,
        description: project.description,
        start_date: project.startDate.toISOString(),
        end_date: project.endDate.toISOString(),
        manager_id: user.id,
        budget: project.budget !== undefined ? project.budget : 0,
        is_completed: isCompleted,
        created_at: nowISO,
        updated_at: nowISO,
        team_members: project.teamMembers || [],
        status: status,
        tasks_count: 0,
        tags: project.tags || []
      });

    if (error) {
      console.error('Error adding project:', error);
      toast.error('Failed to create project');
      playErrorSound();
      return null;
    }

    const newProject: Project = {
      id: projectId,
      title: project.title,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      managerId: user.id,
      budget: project.budget !== undefined ? project.budget : 0,
      createdAt: now,
      updatedAt: now,
      tasks: [],
      teamMembers: project.teamMembers || [],
      is_completed: isCompleted,
      budgetSpent: 0,
      status: status as ProjectStatus,
      tasks_count: 0,
      tags: project.tags || []
    };

    console.log('New project created:', newProject);
    toast.success('Project created successfully');
    playSuccessSound();
    return newProject;
  } catch (error) {
    console.error('Error in addProject:', error);
    toast.error('Failed to create project');
    playErrorSound();
    return null;
  }
};
