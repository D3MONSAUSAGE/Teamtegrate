
import { Project } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { executeRpc } from '@/integrations/supabase/rpc';

export const fetchProjects = async (
  user: { id: string },
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
): Promise<void> => {
  try {
    console.log('Fetching projects for user:', user.id);
    
    // First attempt: Using RPC to bypass RLS policies
    console.log('Attempting to fetch projects via RPC function...');
    const rpcData = await executeRpc('get_all_projects');
    
    if (rpcData !== null && Array.isArray(rpcData)) {
      console.log(`RPC returned project data successfully: ${rpcData.length} projects found`);
      processAndSetProjects(rpcData, user, setProjects);
      return;
    }
    
    console.log('RPC fetch failed or returned null, trying direct query...');
    
    // Second attempt: Direct query
    const { data: directData, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
      setProjects([]);
      return;
    }
    
    if (!directData || directData.length === 0) {
      console.log('No projects found');
      setProjects([]);
      return;
    }
    
    console.log(`Retrieved ${directData.length} projects from database`);
    processAndSetProjects(directData, user, setProjects);
  } catch (error) {
    console.error('Error in fetchProjects:', error);
    toast.error('Failed to load projects');
    setProjects([]);
  }
};

// Helper function to process and format projects
const processAndSetProjects = (
  projectData: any[],
  user: { id: string },
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  if (!projectData || !Array.isArray(projectData)) {
    setProjects([]);
    return;
  }
  
  const formattedProjects: Project[] = projectData.map(project => ({
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
    budgetSpent: project.budget_spent || 0,
    is_completed: project.is_completed || false,
    status: (project.status || 'To Do') as any,
    tasks_count: project.tasks_count || 0,
    tags: project.tags || []
  }));
  
  console.log('Setting projects, final count:', formattedProjects.length);
  setProjects(formattedProjects);
};
