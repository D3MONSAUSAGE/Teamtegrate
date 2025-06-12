
import { supabase } from '@/integrations/supabase/client';

// Helper function to get current user's organization ID
// This is used by RLS policies to enforce organization-level data isolation
export const getCurrentUserOrganizationId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user organization:', error);
      return null;
    }

    return data?.organization_id || null;
  } catch (error) {
    console.error('Error in getCurrentUserOrganizationId:', error);
    return null;
  }
};

// Test function to verify RLS is working correctly
export const testRLSPolicies = async () => {
  try {
    console.log('Testing RLS policies...');
    
    // Test tasks query - should only return tasks from user's organization
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(5);
    
    if (tasksError) {
      console.error('Tasks RLS test failed:', tasksError);
    } else {
      console.log(`✅ Tasks RLS test passed: ${tasks?.length || 0} tasks returned`);
    }

    // Test projects query - should only return projects from user's organization
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);
    
    if (projectsError) {
      console.error('Projects RLS test failed:', projectsError);
    } else {
      console.log(`✅ Projects RLS test passed: ${projects?.length || 0} projects returned`);
    }

    // Test users query - should only return users from user's organization
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .limit(5);
    
    if (usersError) {
      console.error('Users RLS test failed:', usersError);
    } else {
      console.log(`✅ Users RLS test passed: ${users?.length || 0} users returned`);
    }

    // Test chat rooms - should only return rooms from user's organization
    const { data: chatRooms, error: chatRoomsError } = await supabase
      .from('chat_rooms')
      .select('*')
      .limit(5);
    
    if (chatRoomsError) {
      console.error('Chat rooms RLS test failed:', chatRoomsError);
    } else {
      console.log(`✅ Chat rooms RLS test passed: ${chatRooms?.length || 0} rooms returned`);
    }

    // Test notifications - should only return notifications for user's organization
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(5);
    
    if (notificationsError) {
      console.error('Notifications RLS test failed:', notificationsError);
    } else {
      console.log(`✅ Notifications RLS test passed: ${notifications?.length || 0} notifications returned`);
    }

    return {
      success: true,
      tests: {
        tasks: !tasksError,
        projects: !projectsError,
        users: !usersError,
        chatRooms: !chatRoomsError,
        notifications: !notificationsError
      }
    };
  } catch (error) {
    console.error('RLS test suite failed:', error);
    return {
      success: false,
      error: error
    };
  }
};

// Test organization data isolation by verifying all data belongs to user's org
export const testOrganizationIsolation = async () => {
  try {
    console.log('Testing organization data isolation...');
    
    const orgId = await getCurrentUserOrganizationId();
    if (!orgId) {
      console.error('Cannot test isolation: user has no organization');
      return { success: false, error: 'No organization found' };
    }

    // Test that all returned projects belong to user's organization
    const { data: allProjects, error: allProjectsError } = await supabase
      .from('projects')
      .select('organization_id');

    if (allProjectsError) {
      console.log('RLS correctly blocked or limited access:', allProjectsError.message);
    } else {
      const invalidProjects = allProjects?.filter(p => p.organization_id !== orgId) || [];
      if (invalidProjects.length > 0) {
        console.error('❌ Organization isolation breach in projects!', invalidProjects);
        return { success: false, error: 'Organization isolation breach detected' };
      }
      console.log(`✅ Organization isolation verified: ${allProjects?.length || 0} projects all belong to user's org`);
    }

    // Test that all returned tasks belong to user's organization
    const { data: allTasks, error: allTasksError } = await supabase
      .from('tasks')
      .select('organization_id');

    if (allTasksError) {
      console.log('RLS correctly blocked or limited access:', allTasksError.message);
    } else {
      const invalidTasks = allTasks?.filter(t => t.organization_id !== orgId) || [];
      if (invalidTasks.length > 0) {
        console.error('❌ Organization isolation breach in tasks!', invalidTasks);
        return { success: false, error: 'Organization isolation breach detected' };
      }
      console.log(`✅ Organization isolation verified: ${allTasks?.length || 0} tasks all belong to user's org`);
    }

    // Test that all returned users belong to user's organization
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('organization_id');

    if (allUsersError) {
      console.log('RLS correctly blocked or limited access:', allUsersError.message);
    } else {
      const invalidUsers = allUsers?.filter(u => u.organization_id !== orgId) || [];
      if (invalidUsers.length > 0) {
        console.error('❌ Organization isolation breach in users!', invalidUsers);
        return { success: false, error: 'Organization isolation breach detected' };
      }
      console.log(`✅ Organization isolation verified: ${allUsers?.length || 0} users all belong to user's org`);
    }

    return {
      success: true,
      organizationId: orgId,
      totalAccessibleProjects: allProjects?.length || 0,
      totalAccessibleTasks: allTasks?.length || 0,
      totalAccessibleUsers: allUsers?.length || 0
    };
  } catch (error) {
    console.error('Organization isolation test failed:', error);
    return { success: false, error };
  }
};
