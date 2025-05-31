
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

    console.log('TaskContext: Fetching projects for user:', user.id);
    
    // Fetch ALL projects from database
    const { data: allProjects, error: allProjectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (allProjectsError) {
      console.error('Error fetching all projects:', allProjectsError);
      throw allProjectsError;
    }
    
    console.log(`TaskContext: Successfully fetched ${allProjects?.length || 0} total projects`);
    
    // Log all projects for debugging
    allProjects?.forEach(project => {
      console.log(`TaskContext DB Project: ${project.id}, "${project.title}", Manager: ${project.manager_id}`);
    });
    
    // Filter client-side for projects relevant to this user
    const userProjects = allProjects?.filter(project => {
      const isManager = project.manager_id === user.id;
      const isTeamMember = Array.isArray(project.team_members) && 
                          project.team_members.includes(user.id);
      
      const hasAccess = isManager || isTeamMember;
      
      if (hasAccess) {
        console.log(`TaskContext: ✓ Including project ${project.id}: "${project.title}" - User is ${isManager ? 'manager' : 'team member'}`);
      }
      
      return hasAccess;
    }) || [];
    
    console.log(`TaskContext: After filtering, found ${userProjects.length} projects for user ${user.id}`);
    processProjectData(userProjects, user, setProjects);
  } catch (error) {
    console.error('TaskContext: Error in fetchProjects:', error);
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
    console.log('TaskContext: No projects found in database');
    setProjects([]);
    return;
  }
  
  // Log received projects for debugging
  data.forEach(project => {
    console.log(`TaskContext: Processing project: ${project.id}, "${project.title}", Manager: ${project.manager_id}`);
  });

  const formattedProjects: Project[] = data.map(project => {
    // Explicitly ensure status and is_completed are synchronized
    let status = project.status || 'To Do';
    let isCompleted = project.is_completed || false;
    
    // Always enforce consistency between status and is_completed
    if (status === 'Done') {
      isCompleted = true;
    } else if (isCompleted) {
      status = 'Done';
    }
    
    return {
      id: project.id,
      title: project.title || '',
      description: project.description || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      manager_id: project.manager_id || user.id,
      created_at: project.created_at || new Date().toISOString(),
      updated_at: project.updated_at || new Date().toISOString(),
      tasks: [],
      team_members: project.team_members || [],
      budget: project.budget || 0,
      is_completed: isCompleted,
      budget_spent: project.budget_spent || 0,
      status: status as ProjectStatus,
      tasks_count: project.tasks_count || 0,
      tags: project.tags || []
    };
  });

  console.log('TaskContext: Final formatted projects:', formattedProjects.map(p => `${p.id} - "${p.title}"`));
  setProjects(formattedProjects);
};

export const addProject = async (
  project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'tasks'>,
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
    if (status === 'Done') {
      isCompleted = true;
    } else if (isCompleted) {
      status = 'Done';
    }
    
    console.log('Creating project:', {
      id: projectId,
      title: project.title,
      description: project.description,
      start_date: project.start_date,
      end_date: project.end_date,
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
        start_date: project.start_date,
        end_date: project.end_date,
        manager_id: user.id,
        budget: project.budget !== undefined ? project.budget : 0,
        is_completed: isCompleted,
        created_at: nowISO,
        updated_at: nowISO,
        team_members: project.team_members || [],
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
      start_date: project.start_date,
      end_date: project.end_date,
      manager_id: user.id,
      budget: project.budget !== undefined ? project.budget : 0,
      created_at: nowISO,
      updated_at: nowISO,
      tasks: [],
      team_members: project.team_members || [],
      is_completed: isCompleted,
      budget_spent: 0,
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
