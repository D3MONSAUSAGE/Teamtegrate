import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { toast } from 'sonner';
import {
  OnboardingDocumentRequirement,
  OnboardingDocumentSubmission,
  OnboardingApproval,
  OnboardingComplianceItem,
  CreateDocumentRequirementRequest,
  SubmitDocumentRequest,
  ReviewSubmissionRequest,
  UpdateComplianceRequest,
  OnboardingDashboardData,
} from '@/types/onboarding-documents';

// Hook for managing document requirements
export const useDocumentRequirements = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const requirementsQuery = useQuery({
    queryKey: ['onboarding-document-requirements', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) throw new Error('No organization');

      const { data, error } = await supabase
        .from('onboarding_document_requirements')
        .select('*')
        .eq('organization_id', user.organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OnboardingDocumentRequirement[];
    },
    enabled: !!user?.organizationId,
  });

  const createRequirement = useMutation({
    mutationFn: async (requirementData: CreateDocumentRequirementRequest) => {
      if (!user?.organizationId || !user?.id) throw new Error('No user or organization');

      const { data, error } = await supabase
        .from('onboarding_document_requirements')
        .insert({
          ...requirementData,
          organization_id: user.organizationId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-document-requirements'] });
      toast.success('Document requirement created successfully');
    },
    onError: (error) => {
      console.error('Error creating document requirement:', error);
      toast.error('Failed to create document requirement');
    },
  });

  return {
    requirements: requirementsQuery.data ?? [],
    isLoading: requirementsQuery.isLoading,
    error: requirementsQuery.error,
    createRequirement,
    isCreating: createRequirement.isPending,
  };
};

// Hook for managing document submissions
export const useDocumentSubmissions = (instanceId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const submissionsQuery = useQuery({
    queryKey: ['onboarding-document-submissions', user?.organizationId, instanceId],
    queryFn: async () => {
      if (!user?.organizationId) throw new Error('No organization');

      let query = supabase
        .from('onboarding_document_submissions')
        .select(`
          *,
          onboarding_document_requirements (
            name,
            document_type,
            is_required
          ),
          users!onboarding_document_submissions_employee_id_fkey (
            id,
            name,
            email,
            role
          ),
          users!onboarding_document_submissions_reviewed_by_fkey (
            id,
            name,
            email
          )
        `)
        .eq('organization_id', user.organizationId);

      if (instanceId) {
        query = query.eq('instance_id', instanceId);
      }

      const { data, error } = await query.order('submitted_at', { ascending: false });

      if (error) throw error;
      return data as OnboardingDocumentSubmission[];
    },
    enabled: !!user?.organizationId,
  });

  const submitDocument = useMutation({
    mutationFn: async ({ requirement_id, instance_id, file }: SubmitDocumentRequest) => {
      if (!user?.organizationId || !user?.id) throw new Error('No user or organization');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${requirement_id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('onboarding-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create submission record
      const { data, error } = await supabase
        .from('onboarding_document_submissions')
        .insert({
          organization_id: user.organizationId,
          instance_id,
          requirement_id,
          employee_id: user.id,
          file_name: file.name,
          file_path: fileName,
          file_type: fileExt || '',
          file_size: file.size,
          submission_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-document-submissions'] });
      toast.success('Document submitted successfully');
    },
    onError: (error) => {
      console.error('Error submitting document:', error);
      toast.error('Failed to submit document');
    },
  });

  const reviewSubmission = useMutation({
    mutationFn: async ({ submission_id, status, reviewer_notes, rejection_reason }: ReviewSubmissionRequest) => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase
        .from('onboarding_document_submissions')
        .update({
          submission_status: status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          reviewer_notes,
          rejection_reason: status === 'rejected' ? rejection_reason : null,
        })
        .eq('id', submission_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-document-submissions'] });
      toast.success('Document reviewed successfully');
    },
    onError: (error) => {
      console.error('Error reviewing submission:', error);
      toast.error('Failed to review submission');
    },
  });

  return {
    submissions: submissionsQuery.data ?? [],
    isLoading: submissionsQuery.isLoading,
    error: submissionsQuery.error,
    submitDocument,
    reviewSubmission,
    isSubmitting: submitDocument.isPending,
    isReviewing: reviewSubmission.isPending,
  };
};

// Hook for compliance tracking
export const useComplianceTracking = (instanceId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const complianceQuery = useQuery({
    queryKey: ['onboarding-compliance', user?.organizationId, instanceId],
    queryFn: async () => {
      if (!user?.organizationId) throw new Error('No organization');

      let query = supabase
        .from('onboarding_compliance_items')
        .select(`
          *,
          onboarding_instances (
            id,
            employee_id,
            users (
              id,
              name,
              email
            )
          )
        `)
        .eq('organization_id', user.organizationId);

      if (instanceId) {
        query = query.eq('instance_id', instanceId);
      }

      const { data, error } = await query.order('due_date', { ascending: true });

      if (error) throw error;
      return data as OnboardingComplianceItem[];
    },
    enabled: !!user?.organizationId,
  });

  const updateCompliance = useMutation({
    mutationFn: async ({ compliance_item_id, status, notes }: UpdateComplianceRequest) => {
      if (!user?.id) throw new Error('No user');

      const updateData: any = {
        status,
        notes,
      };

      if (status === 'completed') {
        updateData.completed_date = new Date().toISOString();
        updateData.completed_by = user.id;
      }

      const { data, error } = await supabase
        .from('onboarding_compliance_items')
        .update(updateData)
        .eq('id', compliance_item_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-compliance'] });
      toast.success('Compliance item updated successfully');
    },
    onError: (error) => {
      console.error('Error updating compliance item:', error);
      toast.error('Failed to update compliance item');
    },
  });

  return {
    complianceItems: complianceQuery.data ?? [],
    isLoading: complianceQuery.isLoading,
    error: complianceQuery.error,
    updateCompliance,
    isUpdating: updateCompliance.isPending,
  };
};

// Hook for onboarding dashboard data
export const useOnboardingDashboard = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['onboarding-dashboard', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) throw new Error('No organization');

      // Fetch submissions data
      const { data: submissions, error: submissionsError } = await supabase
        .from('onboarding_document_submissions')
        .select(`
          *,
          onboarding_document_requirements (name, document_type),
          users!onboarding_document_submissions_employee_id_fkey (id, name, email)
        `)
        .eq('organization_id', user.organizationId);

      if (submissionsError) throw submissionsError;

      // Fetch compliance data
      const { data: compliance, error: complianceError } = await supabase
        .from('onboarding_compliance_items')
        .select(`
          *,
          onboarding_instances (
            id,
            employee_id,
            users (id, name, email)
          )
        `)
        .eq('organization_id', user.organizationId);

      if (complianceError) throw complianceError;

      // Calculate stats
      const submissionStats = {
        total_submissions: submissions?.length || 0,
        pending_review: submissions?.filter(s => s.submission_status === 'pending' || s.submission_status === 'under_review').length || 0,
        approved: submissions?.filter(s => s.submission_status === 'approved').length || 0,
        rejected: submissions?.filter(s => s.submission_status === 'rejected').length || 0,
        overdue: submissions?.filter(s => 
          s.due_date && 
          new Date(s.due_date) < new Date() && 
          s.submission_status !== 'approved'
        ).length || 0,
        needs_revision: submissions?.filter(s => s.submission_status === 'needs_revision').length || 0,
      };

      const complianceStats = {
        total_items: compliance?.length || 0,
        completed: compliance?.filter(c => c.status === 'completed').length || 0,
        pending: compliance?.filter(c => c.status === 'pending' || c.status === 'in_progress').length || 0,
        overdue: compliance?.filter(c => 
          c.due_date && 
          new Date(c.due_date) < new Date() && 
          c.status !== 'completed'
        ).length || 0,
        completion_rate: compliance?.length ? 
          (compliance.filter(c => c.status === 'completed').length / compliance.length) * 100 : 0,
      };

      return {
        submission_stats: submissionStats,
        compliance_stats: complianceStats,
        recent_submissions: submissions?.slice(0, 10) || [],
        pending_approvals: submissions?.filter(s => s.submission_status === 'pending').slice(0, 10) || [],
        overdue_items: [
          ...(submissions?.filter(s => 
            s.due_date && 
            new Date(s.due_date) < new Date() && 
            s.submission_status !== 'approved'
          ) || []),
          ...(compliance?.filter(c => 
            c.due_date && 
            new Date(c.due_date) < new Date() && 
            c.status !== 'completed'
          ) || [])
        ].slice(0, 10),
      } as OnboardingDashboardData;
    },
    enabled: !!user?.organizationId,
  });
};