
import { supabase } from '@/integrations/supabase/client';

export const runDebugQueries = async () => {
  console.log('🚀 Running debug queries with NEW CLEAN RLS policies...');
  
  // Test auth
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log('👤 Current user:', user?.email, userError);
  
  // Test RLS function - should work perfectly now with clean policies
  const { data: orgId, error: orgError } = await supabase.rpc('get_current_user_organization_id');
  console.log('🏢 Organization ID from clean RLS function:', orgId, orgError);
  
  // Test direct queries with new clean RLS policies
  const queries = [
    { name: 'organizations', table: 'organizations' as const },
    { name: 'users (clean policy)', table: 'users' as const },
    { name: 'projects (clean policy)', table: 'projects' as const },
    { name: 'tasks (clean policy)', table: 'tasks' as const },
    { name: 'team_members (clean policy)', table: 'project_team_members' as const }
  ];
  
  for (const query of queries) {
    const { data, error, count } = await supabase
      .from(query.table)
      .select('*', { count: 'exact' })
      .limit(5);
    
    console.log(`📊 ${query.name} (clean RLS):`, {
      count,
      error: error?.message,
      sampleData: data?.slice(0, 2)
    });
  }
  
  // Test with specific organization filter (should be redundant with clean RLS)
  if (user && orgId) {
    const { data: orgProjects, error: orgProjectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', orgId);
    
    console.log('🎯 Projects for specific org (clean RLS):', {
      orgId,
      count: orgProjects?.length,
      error: orgProjectsError?.message,
      projects: orgProjects?.map(p => ({ id: p.id, title: p.title }))
    });

    const { data: orgTasks, error: orgTasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('organization_id', orgId);
    
    console.log('📋 Tasks for specific org (clean RLS):', {
      orgId,
      count: orgTasks?.length,
      error: orgTasksError?.message,
      tasks: orgTasks?.map(t => ({ id: t.id, title: t.title }))
    });

    const { data: orgUsers, error: orgUsersError } = await supabase
      .from('users')
      .select('*')
      .eq('organization_id', orgId);
    
    console.log('👥 Users for specific org (clean RLS):', {
      orgId,
      count: orgUsers?.length,
      error: orgUsersError?.message,
      users: orgUsers?.map(u => ({ id: u.id, name: u.name, email: u.email }))
    });
  }

  console.log('✅ Debug queries completed with NEW CLEAN RLS policies!');
};

// Auto-run on import in development
if (typeof window !== 'undefined') {
  (window as any).runDebugQueries = runDebugQueries;
  console.log('🔧 Debug function available: runDebugQueries()');
}
