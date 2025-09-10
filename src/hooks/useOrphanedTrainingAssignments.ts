import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { enhancedNotifications } from '@/utils/enhancedNotifications';

export interface OrphanedTrainingAssignment {
  assignment_id: string;
  assignment_type: string;
  content_id: string;
  assigned_to_id: string;
  status: string;
  assigned_at: string;
  content_title: string;
  is_orphaned: boolean;
}

// Hook to fetch orphaned training assignments
export const useOrphanedTrainingAssignments = () => {
  const { user } = useAuth();
  const isAdmin = user && ['admin', 'superadmin', 'manager'].includes(user.role);

  return useQuery({
    queryKey: ['orphaned-training-assignments', user?.organizationId],
    queryFn: async (): Promise<OrphanedTrainingAssignment[]> => {
      if (!user?.organizationId || !isAdmin) return [];

      try {
        // Get all training assignments
        const { data: assignments, error: assignmentsError } = await supabase
          .from('training_assignments')
          .select('*')
          .eq('organization_id', user.organizationId)
          .order('assigned_at', { ascending: false });

        if (assignmentsError) {
          console.error('Error fetching training assignments:', assignmentsError);
          throw assignmentsError;
        }

        if (!assignments || assignments.length === 0) {
          return [];
        }

        // Get all content IDs by type for batch checking
        const complianceIds = assignments
          .filter(a => a.assignment_type === 'compliance_training')
          .map(a => a.content_id);
        const quizIds = assignments
          .filter(a => a.assignment_type === 'quiz')
          .map(a => a.content_id);
        const courseIds = assignments
          .filter(a => a.assignment_type === 'course')
          .map(a => a.content_id);

        // Check which content still exists
        const [complianceTemplates, quizzes, courses] = await Promise.all([
          complianceIds.length > 0 ? 
            supabase.from('compliance_training_templates').select('id').in('id', complianceIds) : 
            Promise.resolve({ data: [] }),
          quizIds.length > 0 ? 
            supabase.from('quizzes').select('id').in('id', quizIds) : 
            Promise.resolve({ data: [] }),
          courseIds.length > 0 ? 
            supabase.from('training_courses').select('id').in('id', courseIds) : 
            Promise.resolve({ data: [] })
        ]);

        const existingComplianceIds = new Set(complianceTemplates.data?.map(c => c.id) || []);
        const existingQuizIds = new Set(quizzes.data?.map(q => q.id) || []);
        const existingCourseIds = new Set(courses.data?.map(c => c.id) || []);

        // Transform assignments and mark orphaned ones
        const orphanedData: OrphanedTrainingAssignment[] = assignments.map(assignment => {
          let isOrphaned = false;
          let contentTitle = assignment.content_title || 'Unknown';

          if (assignment.assignment_type === 'compliance_training') {
            isOrphaned = !existingComplianceIds.has(assignment.content_id);
          } else if (assignment.assignment_type === 'quiz') {
            isOrphaned = !existingQuizIds.has(assignment.content_id);
          } else if (assignment.assignment_type === 'course') {
            isOrphaned = !existingCourseIds.has(assignment.content_id);
          }

          if (isOrphaned && !assignment.content_title) {
            contentTitle = `Deleted ${assignment.assignment_type.replace('_', ' ')}`;
          }

          return {
            assignment_id: assignment.id,
            assignment_type: assignment.assignment_type,
            content_id: assignment.content_id,
            assigned_to_id: assignment.assigned_to,
            status: assignment.status,
            assigned_at: assignment.assigned_at,
            content_title: contentTitle,
            is_orphaned: isOrphaned
          };
        });

        // Return only orphaned assignments
        return orphanedData.filter(assignment => assignment.is_orphaned);
      } catch (error) {
        console.error('Exception in useOrphanedTrainingAssignments:', error);
        throw error;
      }
    },
    enabled: !!user?.organizationId && isAdmin,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 60000 // Keep in cache for 1 minute
  });
};

interface CleanupResult {
  success: boolean;
  orphaned_assignments_cleaned?: number;
  organization_id?: string;
  cleaned_by?: string;
  error?: string;
}

// Hook to clean up orphaned training assignments
export const useCleanupOrphanedAssignments = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (): Promise<CleanupResult> => {
      if (!user?.organizationId) {
        throw new Error('User organization not found');
      }

      const { data, error } = await supabase.rpc('cleanup_orphaned_training_assignments');

      if (error) {
        console.error('Error cleaning up orphaned assignments:', error);
        throw error;
      }

      return (data as unknown) as CleanupResult;
    },
    onSuccess: (data) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['orphaned-training-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['training-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['user-training-assignments'] });

      if (data.success && data.orphaned_assignments_cleaned !== undefined) {
        enhancedNotifications.success(
          `Successfully cleaned up ${data.orphaned_assignments_cleaned} orphaned training assignments`
        );
      } else if (!data.success && data.error) {
        enhancedNotifications.error(data.error);
      }
    },
    onError: (error: any) => {
      console.error('Failed to clean up orphaned assignments:', error);
      const errorMessage = error?.message || 'Failed to clean up orphaned assignments';
      enhancedNotifications.error(errorMessage);
    }
  });
};

// Hook to get orphaned assignments count (for dashboard stats)
export const useOrphanedAssignmentsCount = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['orphaned-assignments-count', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return 0;

      const { data, error } = await supabase.rpc('get_orphaned_assignments_count');

      if (error) {
        console.error('Error getting orphaned assignments count:', error);
        return 0;
      }

      return data || 0;
    },
    enabled: !!user?.organizationId,
    staleTime: 60000, // Cache for 1 minute
  });
};