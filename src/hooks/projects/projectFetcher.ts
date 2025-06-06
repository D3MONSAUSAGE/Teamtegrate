
import { supabase } from '@/integrations/supabase/client';

export const fetchAllProjects = async () => {
  console.log('Fetching ALL projects from database');
  
  const { data: allProjects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (projectsError) {
    console.error('Error fetching projects:', projectsError);
    throw projectsError;
  }
  
  console.log(`Successfully fetched ${allProjects?.length || 0} total projects from database`);
  return allProjects || [];
};

export const fetchTeamMemberships = async (userId: string) => {
  const { data: teamMembersData, error: teamError } = await supabase
    .from('project_team_members')
    .select('project_id, user_id')
    .eq('user_id', userId);
    
  if (teamError) {
    console.warn('Error fetching team member data:', teamError);
    return [];
  }
  
  const projectsUserIsTeamMemberOf = teamMembersData?.map(tm => tm.project_id) || [];
  console.log('Projects user is team member of (from project_team_members):', projectsUserIsTeamMemberOf);
  
  return projectsUserIsTeamMemberOf;
};
