
import { supabase } from '@/integrations/supabase/client';

export const runDebugQueries = async () => {
  console.log('🚀 Running debug queries...');
  
  // Test auth
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log('👤 Current user:', user?.email, userError);
  
  // Test RLS function
  const { data: orgId, error: orgError } = await supabase.rpc('get_current_user_organization_id');
  console.log('🏢 Organization ID from function:', orgId, orgError);
  
  // Test direct queries with proper table names
  const queries = [
    { name: 'organizations', table: 'organizations' as const },
    { name: 'users', table: 'users' as const },
    { name: 'projects', table: 'projects' as const },
    { name: 'tasks', table: 'tasks' as const }
  ];
  
  for (const query of queries) {
    const { data, error, count } = await supabase
      .from(query.table)
      .select('*', { count: 'exact' })
      .limit(5);
    
    console.log(`📊 ${query.name}:`, {
      count,
      error: error?.message,
      sampleData: data?.slice(0, 2)
    });
  }
  
  // Test with specific organization filter
  if (user && orgId) {
    const { data: orgProjects, error: orgProjectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', orgId);
    
    console.log('🎯 Projects for specific org:', {
      orgId,
      count: orgProjects?.length,
      error: orgProjectsError?.message,
      projects: orgProjects
    });
  }
};

// Auto-run on import in development
if (typeof window !== 'undefined') {
  (window as any).runDebugQueries = runDebugQueries;
}
