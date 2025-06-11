
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

// Helper function to validate user has organization
export const validateUserOrganization = (user: { id: string; organization_id?: string } | null): user is { id: string; organization_id: string } => {
  if (!user) {
    throw new Error('User is required for this operation');
  }
  
  if (!user.organization_id) {
    throw new Error('User must belong to an organization');
  }
  
  return true;
};

// Helper function to add organization_id to insert data
export const addOrgIdToInsert = <T extends Record<string, any>>(
  data: T,
  user: { id: string; organization_id?: string } | null
): T & { organization_id: string } => {
  if (!user?.organization_id) {
    throw new Error('User must have an organization_id to insert data');
  }
  
  return {
    ...data,
    organization_id: user.organization_id
  };
};

// Helper function for organization-scoped selects - specific implementations
export const getOrgScopedTasksQuery = (user: { id: string; organization_id?: string } | null) => {
  validateUserOrganization(user);
  
  return supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', user.organization_id);
};

export const getOrgScopedProjectsQuery = (user: { id: string; organization_id?: string } | null) => {
  validateUserOrganization(user);
  
  return supabase
    .from('projects')
    .select('*')
    .eq('organization_id', user.organization_id);
};

export const getOrgScopedCommentsQuery = (user: { id: string; organization_id?: string } | null) => {
  validateUserOrganization(user);
  
  return supabase
    .from('comments')
    .select('*')
    .eq('organization_id', user.organization_id);
};

export const getOrgScopedChatRoomsQuery = (user: { id: string; organization_id?: string } | null) => {
  validateUserOrganization(user);
  
  return supabase
    .from('chat_rooms')
    .select('*')
    .eq('organization_id', user.organization_id);
};

export const getOrgScopedChatMessagesQuery = (user: { id: string; organization_id?: string } | null) => {
  validateUserOrganization(user);
  
  return supabase
    .from('chat_messages')
    .select('*')
    .eq('organization_id', user.organization_id);
};

// Helper function for organization-scoped updates
export const getOrgScopedTaskUpdate = (user: { id: string; organization_id?: string } | null) => {
  validateUserOrganization(user);
  
  return supabase
    .from('tasks')
    .update({})
    .eq('organization_id', user.organization_id);
};

// Helper function for organization-scoped deletes
export const getOrgScopedTaskDelete = (user: { id: string; organization_id?: string } | null) => {
  validateUserOrganization(user);
  
  return supabase
    .from('tasks')
    .delete()
    .eq('organization_id', user.organization_id);
};
