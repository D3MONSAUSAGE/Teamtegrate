import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { RecruitmentDocument } from '@/types/recruitment';

export const useRecruitmentDocuments = (candidateId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['recruitment-documents', candidateId],
    queryFn: async () => {
      if (!user?.organizationId) return [];

      const { data, error } = await supabase
        .from('recruitment_documents')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('organization_id', user.organizationId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as RecruitmentDocument[];
    },
    enabled: !!user?.organizationId && !!candidateId,
  });

  const uploadDocument = useMutation({
    mutationFn: async ({
      file,
      document_type,
    }: {
      file: File;
      document_type: RecruitmentDocument['document_type'];
    }) => {
      if (!user?.organizationId || !user?.id) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${candidateId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('recruitment-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('recruitment-documents')
        .getPublicUrl(fileName);

      // Create document record
      const { data, error } = await supabase
        .from('recruitment_documents')
        .insert({
          organization_id: user.organizationId,
          candidate_id: candidateId,
          document_type,
          file_name: file.name,
          file_url: publicUrl,
          file_size_bytes: file.size,
          uploaded_by: user.id,
          uploaded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-documents', candidateId] });
      toast.success('Document uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload document');
    },
  });

  return {
    documents,
    isLoading,
    uploadDocument: uploadDocument.mutate,
    isUploading: uploadDocument.isPending,
  };
};
