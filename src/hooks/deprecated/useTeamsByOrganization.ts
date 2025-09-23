/**
 * @deprecated Use useTeamAccess from @/hooks/useTeamAccess instead
 * This hook is kept for backward compatibility but will be removed
 * 
 * Migration:
 * - Replace useTeamsByOrganization(orgId) with useTeamAccess()
 * - New hook automatically uses current user's organization
 * - Provides better role-based filtering and consistent interface
 */
import { useTeamAccess } from '@/hooks/useTeamAccess';

export const useTeamsByOrganization = (organizationId?: string) => {
  const { teams, isLoading, error } = useTeamAccess();
  
  return {
    teams,
    isLoading,
    error: error ? (error as Error).message : null,
  };
};