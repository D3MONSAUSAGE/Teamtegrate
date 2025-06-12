
import { supabase } from '@/integrations/supabase/client';

// Test function to verify the new RLS policies are working correctly
export const testProjectsRLSPolicies = async () => {
  try {
    console.log('Testing new Projects RLS policies...');
    
    // Test projects query - should only return projects from user's organization
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);
    
    if (projectsError) {
      console.error('Projects RLS test failed:', projectsError);
      return { success: false, error: projectsError };
    } else {
      console.log(`✅ Projects RLS test passed: ${projects?.length || 0} projects returned`);
    }

    // Test project insertion - should automatically set organization_id
    const testProject = {
      id: `test-${Date.now()}`,
      title: 'RLS Test Project',
      description: 'Testing RLS policies',
      status: 'To Do',
      manager_id: (await supabase.auth.getUser()).data.user?.id,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000).toISOString() // Tomorrow
    };

    const { data: insertedProject, error: insertError } = await supabase
      .from('projects')
      .insert(testProject)
      .select()
      .single();

    if (insertError) {
      console.error('Project insertion test failed:', insertError);
    } else {
      console.log('✅ Project insertion test passed:', insertedProject?.id);
      
      // Clean up test project
      await supabase
        .from('projects')
        .delete()
        .eq('id', insertedProject.id);
      
      console.log('✅ Test project cleaned up');
    }

    return {
      success: true,
      projectsReturned: projects?.length || 0,
      insertionWorked: !insertError
    };
  } catch (error) {
    console.error('RLS test suite failed:', error);
    return {
      success: false,
      error: error
    };
  }
};

// Helper function to verify organization isolation
export const verifyOrganizationIsolation = async () => {
  try {
    console.log('Verifying organization data isolation...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return { success: false, error: 'No authenticated user' };
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Failed to get user organization:', userError);
      return { success: false, error: userError };
    }

    console.log('User organization:', userData.organization_id);

    // Test that all returned projects belong to user's organization
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, organization_id');

    if (projectsError) {
      console.error('Failed to fetch projects for isolation test:', projectsError);
      return { success: false, error: projectsError };
    }

    const invalidProjects = projects?.filter(p => p.organization_id !== userData.organization_id) || [];
    
    if (invalidProjects.length > 0) {
      console.error('❌ Organization isolation failed! Found projects from other organizations:', invalidProjects);
      return { success: false, error: 'Organization isolation breach detected' };
    }

    console.log('✅ Organization isolation verified: All projects belong to user\'s organization');
    
    return {
      success: true,
      userOrganization: userData.organization_id,
      projectsChecked: projects?.length || 0
    };
  } catch (error) {
    console.error('Organization isolation verification failed:', error);
    return { success: false, error };
  }
};
