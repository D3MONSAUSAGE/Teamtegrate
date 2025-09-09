import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types';
import { useJobRoleAssignment } from './useJobRoleAssignment';

interface AssignmentRule {
  id: string;
  organization_id: string;
  request_type_id: string;
  rule_name: string;
  rule_type: string;
  conditions: any;
  assignment_strategy: string;
  escalation_rules: any;
  is_active: boolean;
  priority_order: number;
}

interface ApprovalWorkflow {
  id: string;
  organization_id: string;
  request_type_id: string;
  workflow_name: string;
  approval_levels: any;
  workflow_type: string;
  timeout_hours: number;
  auto_escalate: boolean;
  delegation_allowed: boolean;
  emergency_override_roles: string[];
}

export const useAdvancedAssignment = () => {
  const { user } = useAuth();
  const { trackAssignment } = useJobRoleAssignment();

  const evaluateAssignmentRules = async (
    requestTypeId: string,
    requestData: any,
    users: User[]
  ): Promise<User[]> => {
    if (!user?.organizationId) return [];

    try {
      // Fetch assignment rules for this request type
      const { data: rules, error } = await supabase
        .from('request_assignment_rules')
        .select('*')
        .eq('organization_id', user.organizationId)
        .eq('request_type_id', requestTypeId)
        .eq('is_active', true)
        .order('priority_order', { ascending: true });

      if (error) throw error;

      if (!rules || rules.length === 0) {
        // Fallback to default role-based assignment
        return users.filter(u => ['manager', 'admin', 'superadmin'].includes(u.role));
      }

      let eligibleUsers: User[] = [];

      // Process rules in priority order
      for (const rule of rules) {
        const candidates = await evaluateRule(rule, users, requestData);
        if (candidates.length > 0) {
          eligibleUsers = await applyAssignmentStrategy(
            rule.assignment_strategy,
            candidates,
            rule.conditions,
            { request_type: { ...requestData }, ...requestData }
          );
          break; // Use first matching rule
        }
      }

      return eligibleUsers;
    } catch (error) {
      console.error('Error evaluating assignment rules:', error);
      // Fallback to default assignment
      return users.filter(u => ['manager', 'admin', 'superadmin'].includes(u.role));
    }
  };

  const evaluateRule = async (
    rule: AssignmentRule,
    users: User[],
    requestData: any
  ): Promise<User[]> => {
    const { conditions } = rule;
    let candidates: User[] = [];

    switch (rule.rule_type) {
      case 'role_based':
        if (conditions.roles) {
          candidates = users.filter(u => conditions.roles!.includes(u.role));
        }
        break;

      case 'job_role_based':
        if (conditions.job_roles) {
          // Fetch users with specific job roles
          const { data: userJobRoles, error } = await supabase
            .from('user_job_roles')
            .select(`
              user_id,
              job_roles!inner(name)
            `)
            .eq('organization_id', user!.organizationId)
            .in('job_roles.name', conditions.job_roles);

          if (!error && userJobRoles) {
            const jobRoleUserIds = userJobRoles.map(ujr => ujr.user_id);
            candidates = users.filter(u => jobRoleUserIds.includes(u.id));
          }
        }
        break;

      case 'team_hierarchy':
        if (conditions.team_ids) {
          // Fetch team members
          const { data: teamMembers, error } = await supabase
            .from('team_memberships')
            .select('user_id')
            .in('team_id', conditions.team_ids);

          if (!error && teamMembers) {
            const teamUserIds = teamMembers.map(tm => tm.user_id);
            candidates = users.filter(u => teamUserIds.includes(u.id));
          }
        }
        break;

      case 'custom':
        // For custom logic, evaluate JavaScript-like conditions
        candidates = evaluateCustomLogic(conditions.custom_logic || '', users, requestData);
        break;
    }

    // Filter by organization
    return candidates.filter(u => u.organizationId === user!.organizationId);
  };

  // Smart assignment strategy application with job role integration  
  const applyAssignmentStrategy = async (strategy: string, users: User[], conditions: any, requestData?: any): Promise<User[]> => {
    const { findOptimalAssignees } = useJobRoleAssignment();
    
    switch (strategy) {
      case 'job_role_based':
        if (conditions.job_role_filter?.has_job_role && requestData?.request_type?.default_job_roles) {
          try {
            const assignees = await findOptimalAssignees(
              requestData,
              requestData.request_type.default_job_roles,
              {
                considerWorkload: requestData.request_type.workload_balancing_enabled,
                expertiseRequired: requestData.request_type.expertise_tags || [],
                geographicPreference: requestData.request_type.geographic_scope === 'local_preferred',
                maxAssignees: 1
              }
            );
            // Convert to User type
            return assignees.map((a: any) => ({
              id: a.id,
              email: a.email,
              role: 'user' as UserRole, // Default role, should be enhanced with actual user data
              organizationId: user?.organizationId || '',
              name: a.name,
              createdAt: new Date(),
              timezone: 'UTC'
            }));
          } catch (error) {
            console.error('Job role assignment failed, falling back to role-based:', error);
          }
        }
        return users.slice(0, 1);
      
      case 'round_robin':
        return users.sort((a, b) => a.id.localeCompare(b.id)).slice(0, 1);
      
      case 'least_loaded':
        // Enhanced with actual workload data
        try {
          const assignees = await findOptimalAssignees(requestData || {}, [], {
            considerWorkload: true,
            maxAssignees: 1
          });
          return assignees.map((a: any) => ({
            id: a.id,
            email: a.email,
            role: 'user' as UserRole,
            organizationId: user?.organizationId || '',
            name: a.name,
            createdAt: new Date(),
            timezone: 'UTC'
          }));
        } catch (error) {
          return users.slice(0, 1);
        }
      
      case 'expertise_based':
        if (conditions.expertise_required?.length > 0) {
          try {
            const assignees = await findOptimalAssignees(
              requestData || {},
              [],
              {
                expertiseRequired: conditions.expertise_required,
                maxAssignees: 1
              }
            );
            return assignees.map((a: any) => ({
              id: a.id,
              email: a.email,
              role: 'user' as UserRole,
              organizationId: user?.organizationId || '',
              name: a.name,
              createdAt: new Date(),
              timezone: 'UTC'
            }));
          } catch (error) {
            return users.slice(0, 1);
          }
        }
        return users.slice(0, 1);
      
      case 'random':
        return [users[Math.floor(Math.random() * users.length)]];
      
      default:
        return users.slice(0, 1);
    }
  };

  const evaluateCustomLogic = (logic: string, users: User[], requestData: any): User[] => {
    // Simple custom logic evaluation (can be enhanced)
    try {
      // For safety, only allow basic conditions
      if (logic.includes('priority') && requestData.priority === 'urgent') {
        return users.filter(u => u.role === 'admin' || u.role === 'superadmin');
      }
      
      if (logic.includes('amount') && requestData.form_data?.amount > 1000) {
        return users.filter(u => u.role === 'admin' || u.role === 'superadmin');
      }
      
      return users;
    } catch (error) {
      console.error('Error evaluating custom logic:', error);
      return users;
    }
  };

  const getApprovalWorkflow = async (requestTypeId: string): Promise<ApprovalWorkflow | null> => {
    if (!user?.organizationId) return null;

    try {
      const { data: workflow, error } = await supabase
        .from('request_approval_workflows')
        .select('*')
        .eq('organization_id', user.organizationId)
        .eq('request_type_id', requestTypeId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return workflow;
    } catch (error) {
      console.error('Error fetching approval workflow:', error);
      return null;
    }
  };

  const createDelegation = async (
    requestId: string,
    originalApproverId: string,
    delegateApproverId: string,
    reason?: string,
    expiresAt?: string
  ) => {
    if (!user?.organizationId) return false;

    try {
      const { error } = await supabase
        .from('request_delegations')
        .insert({
          organization_id: user.organizationId,
          request_id: requestId,
          original_approver_id: originalApproverId,
          delegate_approver_id: delegateApproverId,
          delegation_reason: reason,
          expires_at: expiresAt
        });

      if (error) throw error;
      
      // Track assignment analytics
      if (requestId && originalApproverId) {
        await trackAssignment(
          requestId,
          originalApproverId,
          undefined,
          undefined
        );
      }

      return true;
    } catch (error) {
      console.error('Error creating delegation:', error);
      return false;
    }
  };

  const getActiveDelegations = async (userId: string) => {
    if (!user?.organizationId) return [];

    try {
      const { data: delegations, error } = await supabase
        .from('request_delegations')
        .select('*')
        .eq('organization_id', user.organizationId)
        .eq('original_approver_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return delegations || [];
    } catch (error) {
      console.error('Error fetching delegations:', error);
      return [];
    }
  };

  return {
    evaluateAssignmentRules,
    getApprovalWorkflow,
    createDelegation,
    getActiveDelegations
  };
};