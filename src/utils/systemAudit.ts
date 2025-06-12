
import { supabase } from '@/integrations/supabase/client';

export interface SystemAuditData {
  authUser: any;
  currentUserOrg: string | null;
  organizationsCount: number;
  usersInOrg: number;
  projectsInOrg: number;
  tasksInOrg: number;
  allUsers: any[];
  allProjects: any[];
  allTasks: any[];
  organizations: any[];
}

export const performDetailedAudit = async (userOrgId: string): Promise<SystemAuditData> => {
  console.log('🔍 Performing detailed system audit for org:', userOrgId);

  // Get auth user
  const { data: authData } = await supabase.auth.getUser();
  
  // Test RLS function
  const { data: currentUserOrg } = await supabase.rpc('get_current_user_organization_id');
  
  // Get all organizations
  const { data: organizations } = await supabase
    .from('organizations')
    .select('*');
  
  // Get all users (should be filtered by RLS)
  const { data: allUsers } = await supabase
    .from('users')
    .select('*');
  
  // Get all projects (should be filtered by RLS) 
  const { data: allProjects } = await supabase
    .from('projects')
    .select('*');
  
  // Get all tasks (should be filtered by RLS)
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('*');

  console.log('📊 Audit Results:', {
    authUser: authData.user?.id,
    currentUserOrg,
    organizationsTotal: organizations?.length || 0,
    usersVisible: allUsers?.length || 0,
    projectsVisible: allProjects?.length || 0,
    tasksVisible: allTasks?.length || 0
  });

  return {
    authUser: authData.user,
    currentUserOrg,
    organizationsCount: organizations?.length || 0,
    usersInOrg: allUsers?.length || 0,
    projectsInOrg: allProjects?.length || 0,
    tasksInOrg: allTasks?.length || 0,
    allUsers: allUsers || [],
    allProjects: allProjects || [],
    allTasks: allTasks || [],
    organizations: organizations || []
  };
};

export const debugAuthContext = async () => {
  const { data: session } = await supabase.auth.getSession();
  const { data: user } = await supabase.auth.getUser();
  
  console.log('🔐 Auth Debug:', {
    hasSession: !!session.session,
    sessionUser: session.session?.user?.id,
    directUser: user.user?.id,
    userEmail: user.user?.email,
    userMetadata: user.user?.user_metadata,
    appMetadata: user.user?.app_metadata
  });

  return {
    session: session.session,
    user: user.user
  };
};
