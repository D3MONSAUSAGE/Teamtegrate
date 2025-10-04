import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CandidateDetailHeader } from '@/components/recruitment/CandidateDetailHeader';
import { CandidateDetailTabs } from '@/components/recruitment/CandidateDetailTabs';
import { Skeleton } from '@/components/ui/skeleton';
import type { CandidateWithDetails } from '@/types/recruitment';

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: candidate, isLoading } = useQuery({
    queryKey: ['recruitment-candidate', id],
    queryFn: async () => {
      if (!user?.organizationId || !id) return null;

      const { data, error } = await supabase
        .from('recruitment_candidates')
        .select(`
          *,
          position:recruitment_positions(*),
          current_stage:recruitment_pipeline_stages(*)
        `)
        .eq('id', id)
        .eq('organization_id', user.organizationId)
        .single();

      if (error) throw error;
      return data as CandidateWithDetails;
    },
    enabled: !!user?.organizationId && !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Candidate not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <CandidateDetailHeader candidate={candidate} />
      <CandidateDetailTabs candidate={candidate} />
    </div>
  );
}
