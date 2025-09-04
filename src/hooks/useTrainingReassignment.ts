import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

interface ReassignTrainingData {
  assignmentId: string;
  newAssigneeId: string;
  reason: string;
}

interface AssignmentAuditRecord {
  id: string;
  assignment_id: string;
  action_type: string;
  performed_by: string;
  old_values: any;
  new_values: any;
  reason: string;
  created_at: string;
  performer?: {
    name: string;
    email: string;
  };
}

export const useCanReassignTraining = (targetUserRole?: string) => {
  const { user } = useAuth();
  
  const canReassign = () => {
    if (!user) return false;
    
    // Superadmin and admin can reassign anything
    if (['superadmin', 'admin'].includes(user.role)) return true;
    
    // Managers can reassign within their organization
    if (user.role === 'manager') return true;
    
    // Team leaders can reassign to users only
    if (user.role === 'team_leader' && targetUserRole === 'user') return true;
    
    return false;
  };

  return { canReassign: canReassign() };
};

export const useReassignTraining = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ assignmentId, newAssigneeId, reason }: ReassignTrainingData) => {
      if (!user) throw new Error('User not authenticated');

      // First, get the original assignment
      const { data: originalAssignment, error: fetchError } = await supabase
        .from('training_assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (fetchError) throw fetchError;

      // Create new assignment for the new assignee
      const newAssignment = {
        organization_id: originalAssignment.organization_id,
        assigned_by: user.id,
        assigned_to: newAssigneeId,
        content_id: originalAssignment.content_id,
        content_title: originalAssignment.content_title,
        assignment_type: originalAssignment.assignment_type,
        due_date: originalAssignment.due_date,
        priority: originalAssignment.priority,
        status: 'pending',
        reassigned_from: assignmentId,
        reassigned_by: user.id,
        reassignment_reason: reason,
        reassignment_date: new Date().toISOString()
      };

      const { data: newAssignmentData, error: createError } = await supabase
        .from('training_assignments')
        .insert(newAssignment)
        .select()
        .single();

      if (createError) throw createError;

      // Update original assignment to mark it as reassigned
      const { error: updateError } = await supabase
        .from('training_assignments')
        .update({
          status: 'reassigned',
          reassigned_by: user.id,
          reassignment_reason: reason,
          reassignment_date: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (updateError) throw updateError;

      return newAssignmentData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-audit'] });
      toast.success('Training successfully reassigned');
    },
    onError: (error) => {
      console.error('Reassignment failed:', error);
      toast.error('Failed to reassign training');
    },
  });
};

export const useAssignmentAuditHistory = (assignmentId?: string) => {
  return useQuery({
    queryKey: ['assignment-audit', assignmentId],
    queryFn: async (): Promise<AssignmentAuditRecord[]> => {
      if (!assignmentId) return [];

      const { data, error } = await supabase
        .from('training_assignment_audit')
        .select(`
          *,
          performer:performed_by (
            name,
            email
          )
        `)
        .eq('assignment_id', assignmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!assignmentId,
  });
};

export const useSearchAssignments = (searchTerm?: string, filters?: {
  status?: string;
  assignmentType?: string;
  priority?: string;
}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['search-assignments', searchTerm, filters],
    queryFn: async () => {
      // Check if user exists and has valid organizationId
      if (!user || !user.organizationId || user.organizationId.trim() === '') {
        console.log('useSearchAssignments: No valid user or organizationId');
        return [];
      }

      console.log('useSearchAssignments: Fetching assignments for org:', user.organizationId);

      // First get assignments
      let assignmentQuery = supabase
        .from('training_assignments')
        .select('*')
        .eq('organization_id', user.organizationId);

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        assignmentQuery = assignmentQuery.eq('status', filters.status);
      }
      
      if (filters?.assignmentType && filters.assignmentType !== 'all') {
        assignmentQuery = assignmentQuery.eq('assignment_type', filters.assignmentType);
      }
      
      if (filters?.priority && filters.priority !== 'all') {
        assignmentQuery = assignmentQuery.eq('priority', filters.priority);
      }

      // Apply text search on assignment fields only
      if (searchTerm) {
        assignmentQuery = assignmentQuery.ilike('content_title', `%${searchTerm}%`);
      }

      const { data: assignments, error: assignmentError } = await assignmentQuery
        .order('assigned_at', { ascending: false });

      if (assignmentError) throw assignmentError;

      if (!assignments || assignments.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set([
        ...assignments.map(a => a.assigned_to),
        ...assignments.map(a => a.assigned_by)
      ])].filter(Boolean);

      // Fetch user data
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Create user lookup
      const userLookup = (users || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>);

      // Combine assignment data with user data
      const result = assignments.map(assignment => ({
        ...assignment,
        assigned_to_user: userLookup[assignment.assigned_to] || null,
        assigned_by_user: userLookup[assignment.assigned_by] || null
      }));

      // Apply user-based search filter if needed
      const filteredResult = searchTerm ? 
        result.filter(assignment => 
          assignment.content_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.assigned_to_user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.assigned_to_user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
        ) : result;

      console.log('useSearchAssignments: Found assignments:', filteredResult.length);
      return filteredResult;
    },
    enabled: !!user && !!user.organizationId && user.organizationId.trim() !== ''
  });
};

export const useBulkReassignTraining = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      assignmentIds, 
      newAssigneeId, 
      reason 
    }: { 
      assignmentIds: string[]; 
      newAssigneeId: string; 
      reason: string; 
    }) => {
      if (!user) throw new Error('User not authenticated');

      const results = [];
      
      for (const assignmentId of assignmentIds) {
        try {
          // Get original assignment
          const { data: originalAssignment, error: fetchError } = await supabase
            .from('training_assignments')
            .select('*')
            .eq('id', assignmentId)
            .single();

          if (fetchError) throw fetchError;

          // Create new assignment
          const newAssignment = {
            organization_id: originalAssignment.organization_id,
            assigned_by: user.id,
            assigned_to: newAssigneeId,
            content_id: originalAssignment.content_id,
            content_title: originalAssignment.content_title,
            assignment_type: originalAssignment.assignment_type,
            due_date: originalAssignment.due_date,
            priority: originalAssignment.priority,
            status: 'pending',
            reassigned_from: assignmentId,
            reassigned_by: user.id,
            reassignment_reason: reason,
            reassignment_date: new Date().toISOString()
          };

          const { data: newAssignmentData, error: createError } = await supabase
            .from('training_assignments')
            .insert(newAssignment)
            .select()
            .single();

          if (createError) throw createError;

          // Update original assignment
          const { error: updateError } = await supabase
            .from('training_assignments')
            .update({
              status: 'reassigned',
              reassigned_by: user.id,
              reassignment_reason: reason,
              reassignment_date: new Date().toISOString()
            })
            .eq('id', assignmentId);

          if (updateError) throw updateError;

          results.push({ success: true, assignmentId, newAssignment: newAssignmentData });
        } catch (error) {
          results.push({ success: false, assignmentId, error });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      queryClient.invalidateQueries({ queryKey: ['training-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['search-assignments'] });
      
      if (failCount === 0) {
        toast.success(`Successfully reassigned ${successCount} training assignments`);
      } else {
        toast.warning(`Reassigned ${successCount} assignments, ${failCount} failed`);
      }
    },
    onError: (error) => {
      console.error('Bulk reassignment failed:', error);
      toast.error('Failed to reassign training assignments');
    },
  });
};