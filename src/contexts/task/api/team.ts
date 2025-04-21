
import { supabase } from '@/integrations/supabase/client';

// Helper function to get team member name from their ID
export const fetchTeamMemberName = async (memberId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('name')
      .eq('id', memberId)
      .single();
    
    if (error || !data) {
      return 'Unknown';
    }
    
    return data.name;
  } catch (error) {
    console.error('Error fetching team member name:', error);
    return 'Unknown';
  }
};

// Function to check if an email exists in auth.users
export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    // We can't directly query auth.users, so we'll check the public users table
    // which is synced with auth.users
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('email', email.toLowerCase());
    
    if (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
    
    return count !== null && count > 0;
  } catch (error) {
    console.error('Error in checkUserExists:', error);
    return false;
  }
};

// Function to check if a user is already a team member under a specific manager
export const isAlreadyTeamMember = async (email: string, managerId: string): Promise<boolean> => {
  try {
    // This checks if the user is already a team member for this specific manager
    const { count, error } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('email', email.toLowerCase())
      .eq('manager_id', managerId);
    
    if (error) {
      console.error('Error checking if user is already a team member:', error);
      return false;
    }
    
    return count !== null && count > 0;
  } catch (error) {
    console.error('Error in isAlreadyTeamMember:', error);
    return false;
  }
};

// New function to get projects a team member is assigned to
export const getTeamMemberProjects = async (teamMemberId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('project_team_members')
      .select('project_id')
      .eq('team_member_id', teamMemberId);
    
    if (error) {
      console.error('Error getting team member projects:', error);
      return [];
    }
    
    return data.map(item => item.project_id);
  } catch (error) {
    console.error('Error in getTeamMemberProjects:', error);
    return [];
  }
};
