
import { supabase } from '@/integrations/supabase/client';

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
