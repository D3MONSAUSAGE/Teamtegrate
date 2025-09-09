import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useJobRoles } from '@/hooks/useJobRoles';
import { useUserJobRoles } from '@/hooks/useUserJobRoles';

interface ApproverWorkload {
  approver_id: string;
  active_requests: number;
  avg_pending_hours: number;
  pending_count: number;
}

interface AssignmentTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  rule_config: any;
  is_global: boolean;
}

export const useJobRoleAssignment = () => {
  const { user } = useAuth();
  const { jobRoles } = useJobRoles();

  // Fetch workload data for approvers
  const { data: approverWorkloads = [] } = useQuery({
    queryKey: ['approver-workloads', user?.organizationId],
    queryFn: async (): Promise<ApproverWorkload[]> => {
      if (!user?.organizationId) return [];
      
      const { data, error } = await supabase
        .from('approver_workloads')
        .select('*');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.organizationId,
  });

  // Fetch assignment rule templates
  const { data: templates = [] } = useQuery({
    queryKey: ['assignment-templates', user?.organizationId],
    queryFn: async (): Promise<AssignmentTemplate[]> => {
      if (!user?.organizationId) return [];
      
      const { data, error } = await supabase
        .from('assignment_rule_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.organizationId,
  });

  // Get users with specific job roles
  const getUsersWithJobRoles = async (jobRoleIds: string[]) => {
    if (!user?.organizationId || !jobRoleIds.length) return [];
    
    const { data, error } = await supabase
      .from('user_job_roles')
      .select(`
        user_id,
        is_primary,
        job_role:job_roles(id, name),
        user:users!user_job_roles_user_id_fkey(id, name, email, expertise_tags, location, workload_preference)
      `)
      .eq('organization_id', user.organizationId)
      .in('job_role_id', jobRoleIds);

    if (error) throw error;
    return data || [];
  };

  // Smart assignment algorithm with workload balancing
  const findOptimalAssignees = (
    requestData: any,
    jobRoleIds: string[],
    options: {
      considerWorkload?: boolean;
      expertiseRequired?: string[];
      geographicPreference?: boolean;
      maxAssignees?: number;
    } = {}
  ) => {
    const {
      considerWorkload = true,
      expertiseRequired = [],
      geographicPreference = false,
      maxAssignees = 1
    } = options;

    return getUsersWithJobRoles(jobRoleIds).then(usersWithRoles => {
      let candidates = usersWithRoles.filter(ur => ur.user);

      // Filter by expertise if required
      if (expertiseRequired.length > 0) {
        candidates = candidates.filter(ur => {
          const userExpertise = ur.user?.expertise_tags || [];
          return expertiseRequired.some(tag => userExpertise.includes(tag));
        });
      }

      // Apply geographic preference if enabled
      if (geographicPreference && requestData.location) {
        const localCandidates = candidates.filter(ur => ur.user?.location === requestData.location);
        if (localCandidates.length > 0) {
          candidates = localCandidates;
        }
      }

      // Sort by workload if consideration is enabled
      if (considerWorkload) {
        candidates.sort((a, b) => {
          const workloadA = approverWorkloads.find(w => w.approver_id === a.user_id);
          const workloadB = approverWorkloads.find(w => w.approver_id === b.user_id);
          
          const scoreA = (workloadA?.pending_count || 0) * 2 + (workloadA?.active_requests || 0);
          const scoreB = (workloadB?.pending_count || 0) * 2 + (workloadB?.active_requests || 0);
          
          return scoreA - scoreB; // Lower score = less workload = higher priority
        });
      }

      // Prioritize primary job role holders
      candidates.sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return 0;
      });

      return candidates.slice(0, maxAssignees).map(c => c.user);
    });
  };

  // Track assignment analytics
  const trackAssignment = async (
    requestId: string,
    approverId: string,
    assignmentRuleId?: string,
    jobRoleId?: string
  ) => {
    if (!user?.organizationId) return;

    const { error } = await supabase
      .from('request_assignment_analytics')
      .insert({
        organization_id: user.organizationId,
        request_id: requestId,
        approver_id: approverId,
        assignment_rule_id: assignmentRuleId,
        job_role_id: jobRoleId
      });

    if (error) {
      console.error('Failed to track assignment analytics:', error);
    }
  };

  return {
    jobRoles,
    approverWorkloads,
    templates,
    getUsersWithJobRoles,
    findOptimalAssignees,
    trackAssignment
  };
};