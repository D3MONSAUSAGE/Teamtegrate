
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

// Helper function to get organization-scoped query builder
export const getOrgScopedQuery = (table: string, user: User | null) => {
  if (!user?.organization_id) {
    throw new Error('User must have an organization_id to perform this operation');
  }
  
  return supabase
    .from(table)
    .select('*')
    .eq('organization_id', user.organization_id);
};

// Helper function to add organization_id to insert data
export const addOrgIdToInsert = <T extends Record<string, any>>(
  data: T,
  user: User | null
): T & { organization_id: string } => {
  if (!user?.organization_id) {
    throw new Error('User must have an organization_id to insert data');
  }
  
  return {
    ...data,
    organization_id: user.organization_id
  };
};

// Helper function to validate user has organization
export const validateUserOrganization = (user: User | null): asserts user is User & { organization_id: string } => {
  if (!user) {
    throw new Error('User is required for this operation');
  }
  
  if (!user.organization_id) {
    throw new Error('User must belong to an organization');
  }
};

// Helper function to get organization-scoped select query
export const getOrgScopedSelect = (table: string, user: User | null, columns = '*') => {
  validateUserOrganization(user);
  
  return supabase
    .from(table)
    .select(columns)
    .eq('organization_id', user.organization_id);
};

// Helper function for organization-scoped updates
export const getOrgScopedUpdate = (table: string, user: User | null) => {
  validateUserOrganization(user);
  
  return supabase
    .from(table)
    .update({})
    .eq('organization_id', user.organization_id);
};

// Helper function for organization-scoped deletes
export const getOrgScopedDelete = (table: string, user: User | null) => {
  validateUserOrganization(user);
  
  return supabase
    .from(table)
    .delete()
    .eq('organization_id', user.organization_id);
};
