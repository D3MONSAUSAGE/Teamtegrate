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
      const { data, error } = await supabase
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
          priority,
          users!training_assignments_assigned_to_fkey (
            name,
            email
          )
        `)
        .eq('assignment_type', 'course')
        .neq('certificate_status', 'not_required');

      if (error) {
        console.error('Error fetching certificate assignments:', error);
        throw error;
      }

      // Transform the data to match our interface
      return data?.map(assignment => ({
        ...assignment,
        assigned_to_user: assignment.users ? {
          name: (assignment.users as any).name,
          email: (assignment.users as any).email
        } : undefined
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
      const { data, error } = await supabase
        .from('training_assignments')
        .update({
          certificate_status: status,
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          verification_notes: notes
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['certificate-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['training-assignments'] });
      
      enhancedNotifications.success(
        `Certificate ${variables.status === 'verified' ? 'approved' : 'rejected'} successfully`,
        {
          description: `Certificate for "${data.content_title}" has been ${variables.status}`
        }
      );
    },
    onError: (error) => {
      enhancedNotifications.error('Failed to update certificate status', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
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