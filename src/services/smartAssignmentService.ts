import { supabase } from '@/integrations/supabase/client';
import { RequestType } from '@/types/requests';
import { User, UserRole } from '@/types';

export interface AssignmentConfig {
  selectedUserIds?: string[];
  selectedJobRoles?: string[];
  assignmentStrategy: 'first_available' | 'round_robin' | 'least_busy' | 'manual' | 'auto';
  expertiseRequired?: string[];
  geographicPreference?: boolean;
  workloadBalancingEnabled?: boolean;
}

export interface AssignmentResult {
  success: boolean;
  assignedUsers: User[];
  assignmentMethod: string;
  ruleName?: string;
  message?: string;
  error?: string;
}

export class SmartAssignmentService {
  /**
   * Main assignment function - assigns users to a request based on request type configuration
   */
  static async assignRequest(
    requestId: string,
    requestType: RequestType,
    requestData: any,
    organizationId: string
  ): Promise<AssignmentResult> {
    try {
      // First check if request type has specific assignment configuration
      if (requestType.default_job_roles?.length || requestType.selected_user_ids?.length) {
        const config: AssignmentConfig = {
          selectedJobRoles: requestType.default_job_roles || [],
          selectedUserIds: requestType.selected_user_ids || [],
          assignmentStrategy: requestType.assignment_strategy || 'first_available',
          expertiseRequired: requestType.expertise_tags || [],
          geographicPreference: requestType.geographic_scope === 'local',
          workloadBalancingEnabled: requestType.workload_balancing_enabled || false
        };

        return await this.executeAssignment(requestId, config, requestData, organizationId);
      }

      // Fallback to hierarchy-based assignment
      return await this.hierarchyBasedAssignment(requestId, requestType.name, organizationId);
    } catch (error) {
      console.error('Error in smart assignment:', error);
      return { 
        success: false, 
        assignedUsers: [], 
        assignmentMethod: 'failed',
        error: error instanceof Error ? error.message : 'Assignment failed'
      };
    }
  }

  /**
   * Execute assignment based on configuration
   */
  private static async executeAssignment(
    requestId: string,
    config: AssignmentConfig,
    requestData: any,
    organizationId: string
  ): Promise<AssignmentResult> {
    let candidates: User[] = [];

    // Step 1: Get candidates from job roles or specific users
    if (config.selectedJobRoles?.length) {
      candidates = await this.getUsersFromJobRoles(config.selectedJobRoles, organizationId);
    } else if (config.selectedUserIds?.length) {
      candidates = await this.getUsersById(config.selectedUserIds, organizationId);
    }

    // Step 2: Apply expertise filtering
    if (config.expertiseRequired?.length && candidates.length > 0) {
      candidates = await this.filterByExpertise(candidates, config.expertiseRequired);
    }

    // Step 3: Apply geographic filtering
    if (config.geographicPreference && requestData.location && candidates.length > 0) {
      const localCandidates = candidates.filter(user => user.location === requestData.location);
      if (localCandidates.length > 0) {
        candidates = localCandidates;
      }
    }

    // Step 4: Apply assignment strategy
    const assignedUsers = await this.applyAssignmentStrategy(
      candidates,
      config.assignmentStrategy,
      config.workloadBalancingEnabled || false,
      organizationId
    );

    // Step 5: Record assignment in database
    if (assignedUsers.length > 0) {
      await this.recordAssignment(requestId, assignedUsers[0].id, organizationId);
    }

    return {
      success: true,
      assignedUsers,
      assignmentMethod: config.assignmentStrategy,
      ruleName: 'Smart Assignment'
    };
  }

  /**
   * Fallback hierarchy-based assignment
   */
  private static async hierarchyBasedAssignment(
    requestId: string,
    requestTypeName: string,
    organizationId: string
  ): Promise<AssignmentResult> {
    const assignedUsers: User[] = [];

    try {
      // For time entry corrections, prioritize team managers
      if (requestTypeName === 'Time Entry Correction') {
        const { data: managerId } = await supabase.rpc('get_user_team_manager', { 
          target_user_id: (await supabase.auth.getUser()).data.user?.id 
        });
        
        if (managerId) {
          const { data: manager } = await supabase
            .from('users')
            .select('id, name, email, role, location, expertise_tags, workload_preference, organization_id, created_at, timezone, avatar_url')
            .eq('id', managerId)
            .single();
          
          if (manager) {
            assignedUsers.push({
              id: manager.id,
              email: manager.email,
              role: manager.role as UserRole,
              organizationId: manager.organization_id,
              name: manager.name,
              createdAt: new Date(manager.created_at),
              location: manager.location,
              expertise_tags: manager.expertise_tags,
              workload_preference: manager.workload_preference
            });
            await this.recordAssignment(requestId, managerId, organizationId);
          }
        }
      }

      // If no specific assignment, assign to admins
      if (assignedUsers.length === 0) {
        const { data: admins } = await supabase
          .from('users')
            .select('id, name, email, role, location, expertise_tags, workload_preference, organization_id, created_at, timezone, avatar_url')
          .eq('organization_id', organizationId)
          .in('role', ['admin', 'superadmin'])
          .limit(1);

        if (admins && admins.length > 0) {
          assignedUsers.push({
            id: admins[0].id,
            email: admins[0].email,
            role: admins[0].role as UserRole,
            organizationId: admins[0].organization_id,
            name: admins[0].name,
            createdAt: new Date(admins[0].created_at),
            location: admins[0].location,
            expertise_tags: admins[0].expertise_tags,
            workload_preference: admins[0].workload_preference
          });
          await this.recordAssignment(requestId, admins[0].id, organizationId);
        }
      }
    } catch (error) {
      console.error('Error in hierarchy-based assignment:', error);
    }

    return {
      success: assignedUsers.length > 0,
      assignedUsers,
      assignmentMethod: 'hierarchy',
      ruleName: 'Hierarchy-based Assignment',
      message: assignedUsers.length === 0 ? 'No suitable managers found for assignment' : undefined
    };
  }

  /**
   * Get users from job roles
   */
  private static async getUsersFromJobRoles(jobRoleIds: string[], organizationId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('user_job_roles')
      .select(`
        user_id,
        is_primary,
        user:users!user_job_roles_user_id_fkey(id, name, email, role, location, expertise_tags, workload_preference, organization_id, created_at, timezone, avatar_url)
      `)
      .eq('organization_id', organizationId)
      .in('job_role_id', jobRoleIds);

    if (error) {
      console.error('Error fetching users from job roles:', error);
      return [];
    }

    return (data || [])
      .filter(ur => ur.user)
      .map(ur => ({
        id: ur.user.id,
        email: ur.user.email,
        role: ur.user.role as UserRole,
        organizationId: ur.user.organization_id,
        name: ur.user.name,
        timezone: ur.user.timezone,
        createdAt: new Date(ur.user.created_at),
        avatar_url: ur.user.avatar_url,
        location: ur.user.location,
        expertise_tags: ur.user.expertise_tags,
        workload_preference: ur.user.workload_preference
      }))
      .sort((a, b) => {
        // Prioritize primary job role holders
        const aIsPrimary = data.find(ur => ur.user_id === a.id)?.is_primary;
        const bIsPrimary = data.find(ur => ur.user_id === b.id)?.is_primary;
        if (aIsPrimary && !bIsPrimary) return -1;
        if (!aIsPrimary && bIsPrimary) return 1;
        return 0;
      });
  }

  /**
   * Get users by their IDs
   */
  private static async getUsersById(userIds: string[], organizationId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, location, expertise_tags, workload_preference, organization_id, created_at, timezone, avatar_url')
      .eq('organization_id', organizationId)
      .in('id', userIds);

    if (error) {
      console.error('Error fetching users by ID:', error);
      return [];
    }

    return (data || []).map(user => ({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      organizationId: user.organization_id,
      name: user.name,
      timezone: user.timezone,
      createdAt: new Date(user.created_at),
      avatar_url: user.avatar_url,
      location: user.location,
      expertise_tags: user.expertise_tags,
      workload_preference: user.workload_preference
    }));
  }

  /**
   * Filter users by expertise
   */
  private static async filterByExpertise(users: User[], expertiseRequired: string[]): Promise<User[]> {
    return users.filter(user => {
      const userExpertise = user.expertise_tags || [];
      return expertiseRequired.some(tag => userExpertise.includes(tag));
    });
  }

  /**
   * Apply assignment strategy
   */
  private static async applyAssignmentStrategy(
    candidates: User[],
    strategy: string,
    workloadBalancing: boolean,
    organizationId: string
  ): Promise<User[]> {
    if (candidates.length === 0) return [];

    // Apply workload balancing if enabled
    if (workloadBalancing) {
      candidates = await this.applyWorkloadBalancing(candidates, organizationId);
    }

    switch (strategy) {
      case 'first_available':
        return candidates.slice(0, 1);
      
      case 'round_robin':
        // Simple round-robin - can be enhanced with persistent state
        return [candidates[Math.floor(Math.random() * candidates.length)]];
      
      case 'least_busy':
        // Already handled by workload balancing
        return candidates.slice(0, 1);
      
      case 'manual':
        // Return all candidates for manual selection
        return candidates;
      
      case 'auto':
      default:
        return candidates.slice(0, 1);
    }
  }

  /**
   * Apply workload balancing
   */
  private static async applyWorkloadBalancing(users: User[], organizationId: string): Promise<User[]> {
    try {
      const { data: workloads } = await supabase
        .from('approver_workloads')
        .select('*');

      if (!workloads) return users;

      // Sort by workload (lower workload = higher priority)
      return users.sort((a, b) => {
        const workloadA = workloads.find(w => w.approver_id === a.id);
        const workloadB = workloads.find(w => w.approver_id === b.id);
        
        const scoreA = (workloadA?.pending_count || 0) * 2 + (workloadA?.active_requests || 0);
        const scoreB = (workloadB?.pending_count || 0) * 2 + (workloadB?.active_requests || 0);
        
        return scoreA - scoreB;
      });
    } catch (error) {
      console.error('Error applying workload balancing:', error);
      return users;
    }
  }

  /**
   * Record assignment in database
   */
  private static async recordAssignment(requestId: string, userId: string, organizationId: string): Promise<void> {
    try {
      // Update the request with assignment
      await supabase
        .from('requests')
        .update({
          assigned_to: userId,
          assigned_at: new Date().toISOString(),
          status: 'under_review'
        })
        .eq('id', requestId);

      // Log the assignment activity
      await supabase
        .from('request_activity_feed')
        .insert({
          organization_id: organizationId,
          request_id: requestId,
          user_id: userId,
          activity_type: 'approver_assigned',
          activity_data: { assigned_via: 'smart_assignment' }
        });

    } catch (error) {
      console.error('Error recording assignment:', error);
    }
  }

  /**
   * Send assignment notifications
   */
  static async sendAssignmentNotifications(
    requestId: string,
    assignedUsers: User[],
    requestTitle: string,
    organizationId: string
  ): Promise<void> {
    try {
      if (assignedUsers.length === 0) return;

      const userIds = assignedUsers.map(user => user.id);
      
      // Use the notification function we created earlier
      await supabase.rpc('send_notification_to_multiple', {
        recipient_ids: userIds,
        notification_title: 'New Request Assignment',
        notification_content: `You have been assigned a new request: "${requestTitle}"`,
        notification_type: 'request_assignment',
        metadata_json: { request_id: requestId },
        org_id: organizationId
      });

    } catch (error) {
      console.error('Error sending assignment notifications:', error);
    }
  }
}