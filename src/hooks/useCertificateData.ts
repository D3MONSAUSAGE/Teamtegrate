import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { enhancedNotifications } from '@/utils/enhancedNotifications';

export interface CertificateAssignment {
  id: string;
  content_title: string;
  assigned_to: string;
  assigned_to_user?: {
    name: string;
    email: string;
  };
  certificate_url?: string;
  certificate_status: string;
  certificate_uploaded_at?: string;
  verified_at?: string;
  verified_by?: string;
  verification_notes?: string;
  due_date?: string;
  priority: string;
}

export const useCertificateAssignments = () => {
  return useQuery({
    queryKey: ['certificate-assignments'],
    queryFn: async () => {
      // First get the training assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('training_assignments')
        .select(`
          id,
          content_title,
          assigned_to,
          certificate_url,
          certificate_status,
          certificate_uploaded_at,
          verified_at,
          verified_by,
          verification_notes,
          due_date,
          priority
        `)
        .eq('assignment_type', 'course')
        .neq('certificate_status', 'not_required');

      if (assignmentsError) {
        console.error('Error fetching certificate assignments:', assignmentsError);
        throw assignmentsError;
      }

      if (!assignments || assignments.length === 0) {
        return [];
      }

      // Get user IDs to fetch user details
      const userIds = assignments.map(a => a.assigned_to).filter(Boolean);
      
      // Fetch user details
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching user details:', usersError);
        // Don't throw error, just continue without user details
      }

      // Create user lookup map
      const userMap = new Map();
      users?.forEach(user => {
        userMap.set(user.id, { name: user.name, email: user.email });
      });

      // Transform the data to match our interface
      return assignments.map(assignment => ({
        ...assignment,
        assigned_to_user: userMap.get(assignment.assigned_to) || undefined
      })) as CertificateAssignment[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};

export const useVerifyCertificate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      assignmentId, 
      status, 
      notes 
    }: { 
      assignmentId: string; 
      status: 'verified' | 'rejected'; 
      notes?: string 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      // Verify the assignment exists and user has permission
      const { data: assignment, error: checkError } = await supabase
        .from('training_assignments')
        .select('id, assigned_to, content_title, organization_id, certificate_status')
        .eq('id', assignmentId)
        .single();

      if (checkError || !assignment) {
        throw new Error('Assignment not found or access denied');
      }

      if (assignment.certificate_status !== 'uploaded') {
        throw new Error('Certificate must be uploaded before verification');
      }

      // Update the certificate status (and mark assignment completed if verified)
      const updateData: any = {
        certificate_status: status,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
        verification_notes: notes?.trim() || null
      };
      if (status === 'verified') {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
        updateData.completion_score = 100;
      }
      const { data, error } = await supabase
        .from('training_assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .select()
        .single();
      if (error) {
        console.error('Certificate verification error:', error);
        throw new Error(`Failed to ${status === 'verified' ? 'approve' : 'reject'} certificate: ${error.message}`);
      }

      // Send notification to user about status change
      try {
        await supabase.functions.invoke('send-certificate-notification', {
          body: {
            assignmentId,
            userId: assignment.assigned_to,
            type: 'status_change',
            status,
            courseTitle: assignment.content_title,
            notes: notes?.trim()
          }
        });
      } catch (notificationError) {
        console.warn('Failed to send certificate notification:', notificationError);
        // Don't fail the whole operation if notification fails
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['certificate-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['training-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['certificate-stats'] });
      
      const statusText = variables.status === 'verified' ? 'approved' : 'rejected';
      enhancedNotifications.success(
        `Certificate ${statusText} successfully`,
        {
          description: `The user will be notified of the ${statusText} status.`
        }
      );
    },
    onError: (error) => {
      console.error('Certificate verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update certificate status';
      enhancedNotifications.error('Certificate Verification Failed', {
        description: errorMessage
      });
    }
  });
};

export const useBulkVerifyCertificates = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      assignmentIds, 
      status, 
      notes 
    }: { 
      assignmentIds: string[]; 
      status: 'verified' | 'rejected'; 
      notes?: string 
    }) => {
      const { data, error } = await supabase
        .from('training_assignments')
        .update({
          certificate_status: status,
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          verification_notes: notes
        })
        .in('id', assignmentIds)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['certificate-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['training-assignments'] });
      
      enhancedNotifications.success(
        `${data.length} certificates ${variables.status === 'verified' ? 'approved' : 'rejected'}`,
        {
          description: `Bulk action completed successfully`
        }
      );
    },
    onError: (error) => {
      enhancedNotifications.error('Failed to update certificates', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });
};

export const useCertificateStats = () => {
  return useQuery({
    queryKey: ['certificate-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_assignments')
        .select('certificate_status')
        .eq('assignment_type', 'course')
        .neq('certificate_status', 'not_required');

      if (error) throw error;

      const stats = {
        total: data.length,
        uploaded: data.filter(a => a.certificate_status === 'uploaded').length,
        verified: data.filter(a => a.certificate_status === 'verified').length,
        rejected: data.filter(a => a.certificate_status === 'rejected').length,
      };

      return stats;
    },
    refetchInterval: 60000, // Refetch every minute
  });
};