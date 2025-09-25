import { supabase } from '@/integrations/supabase/client';

export interface OrganizationData {
  id: string;
  name: string;
  timezone?: string;
  manageNotificationsUrl: string;
}

/**
 * Get organization details for the current user
 */
export const getCurrentUserOrganization = async (): Promise<OrganizationData | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData?.organization_id) return null;

    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name, timezone')
      .eq('id', userData.organization_id)
      .single();

    if (!orgData) return null;

    return {
      id: orgData.id,
      name: orgData.name,
      timezone: orgData.timezone || 'UTC',
      manageNotificationsUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://teamtegrate.com'}/settings/notifications`
    };
  } catch (error) {
    console.error('Error fetching organization data:', error);
    return null;
  }
};

/**
 * Get organization data by ID
 */
export const getOrganizationById = async (orgId: string): Promise<OrganizationData | null> => {
  try {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name, timezone')
      .eq('id', orgId)
      .single();

    if (!orgData) return null;

    return {
      id: orgData.id,
      name: orgData.name,
      timezone: orgData.timezone || 'UTC',
      manageNotificationsUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://teamtegrate.com'}/settings/notifications`
    };
  } catch (error) {
    console.error('Error fetching organization data:', error);
    return null;
  }
};