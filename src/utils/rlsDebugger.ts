
import { supabase } from '@/integrations/supabase/client';

export const debugRLSPolicies = async (userId: string, organizationId: string) => {
  console.log('🔍 RLS Debug Session Started', {
    userId,
    organizationId,
    timestamp: new Date().toISOString()
  });

  try {
    // Test direct task access
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, organization_id, user_id, assigned_to_id')
      .limit(5);

    console.log('🔍 Tasks query result:', {
      success: !tasksError,
      error: tasksError?.message,
      taskCount: tasksData?.length,
      tasks: tasksData?.map(t => ({
        id: t.id,
        title: t.title,
        org: t.organization_id,
        belongsToUser: t.organization_id === organizationId
      }))
    });

    // Test direct project access
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, organization_id, manager_id')
      .limit(5);

    console.log('🔍 Projects query result:', {
      success: !projectsError,
      error: projectsError?.message,
      projectCount: projectsData?.length,
      projects: projectsData?.map(p => ({
        id: p.id,
        title: p.title,
        org: p.organization_id,
        belongsToUser: p.organization_id === organizationId
      }))
    });

    // Test user's organization data
    const { data: orgUsers, error: orgError } = await supabase
      .from('users')
      .select('id, name, email, role, organization_id')
      .eq('organization_id', organizationId);

    console.log('🔍 Organization users:', {
      success: !orgError,
      error: orgError?.message,
      userCount: orgUsers?.length,
      users: orgUsers?.map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        isCurrentUser: u.id === userId
      }))
    });

  } catch (error) {
    console.error('🔍 RLS Debug Session failed:', error);
  }
};

export const clearAllCaches = () => {
  console.log('🧹 Clearing all caches...');
  
  // Clear localStorage
  const localStorageKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    localStorageKeys.push(localStorage.key(i));
  }
  localStorageKeys.forEach(key => {
    if (key && (key.includes('task') || key.includes('project') || key.includes('supabase'))) {
      localStorage.removeItem(key);
      console.log(`🧹 Cleared localStorage: ${key}`);
    }
  });

  // Clear sessionStorage
  sessionStorage.clear();
  console.log('🧹 Cleared sessionStorage');

  // Clear any query cache
  if (window.location.reload) {
    console.log('🧹 Recommending page reload for complete cache clear');
  }
};
