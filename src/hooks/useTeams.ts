/**
 * @deprecated Use useTeamAccess from @/hooks/useTeamAccess instead
 * This hook is kept for backward compatibility but will be removed
 * 
 * Migration:
 * - Replace useTeams() with useTeamAccess()
 * - New hook provides better role-based filtering and consistent interface
 */
export { useTeamAccess as useTeams } from '@/hooks/useTeamAccess';