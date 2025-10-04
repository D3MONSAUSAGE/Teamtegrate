import { useState } from 'react';
import { ArrowLeft, Mail, Phone, CheckCircle, XCircle, MoveRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CandidateWithDetails } from '@/types/recruitment';
import { useRecruitmentPipeline } from '@/hooks/recruitment/useRecruitmentPipeline';

interface CandidateDetailHeaderProps {
  candidate: CandidateWithDetails;
}

export function CandidateDetailHeader({ candidate }: CandidateDetailHeaderProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { stages } = useRecruitmentPipeline();
  const [isMoving, setIsMoving] = useState(false);

  const updateStatus = useMutation({
    mutationFn: async (status: 'hired' | 'rejected') => {
      const { error } = await supabase
        .from('recruitment_candidates')
        .update({ status })
        .eq('id', candidate.id);

      if (error) throw error;
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-candidate', candidate.id] });
      queryClient.invalidateQueries({ queryKey: ['recruitment-candidates'] });
      toast.success(`Candidate ${status === 'hired' ? 'hired' : 'rejected'} successfully`);
    },
    onError: () => {
      toast.error('Failed to update candidate status');
    },
  });

  const moveToStage = useMutation({
    mutationFn: async (stageId: string) => {
      const { error } = await supabase
        .from('recruitment_candidates')
        .update({ current_stage_id: stageId })
        .eq('id', candidate.id);

      if (error) throw error;

      await supabase.from('recruitment_stage_transitions').insert({
        organization_id: candidate.organization_id,
        candidate_id: candidate.id,
        from_stage_id: candidate.current_stage_id,
        to_stage_id: stageId,
        transition_date: new Date().toISOString(),
        automated: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-candidate', candidate.id] });
      queryClient.invalidateQueries({ queryKey: ['recruitment-candidates'] });
      toast.success('Candidate moved to new stage');
      setIsMoving(false);
    },
    onError: () => {
      toast.error('Failed to move candidate');
      setIsMoving(false);
    },
  });

  const getInitials = () => {
    return `${candidate.first_name[0]}${candidate.last_name[0]}`.toUpperCase();
  };

  const getStatusColor = () => {
    switch (candidate.status) {
      case 'active':
        return 'bg-blue-500';
      case 'hired':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'withdrawn':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard/recruitment')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold">
              {candidate.first_name} {candidate.last_name}
            </h1>
            <p className="text-muted-foreground">
              Applied for: {candidate.position?.job_title}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {candidate.email && (
              <a
                href={`mailto:${candidate.email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
                {candidate.email}
              </a>
            )}
            {candidate.phone && (
              <a
                href={`tel:${candidate.phone}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Phone className="h-4 w-4" />
                {candidate.phone}
              </a>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Badge className={getStatusColor()}>
              {candidate.status}
            </Badge>
            {candidate.current_stage && (
              <Badge style={{ backgroundColor: candidate.current_stage.color_code }}>
                {candidate.current_stage.stage_name}
              </Badge>
            )}
            <Badge variant="outline">
              {candidate.source}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {candidate.status === 'active' && (
            <>
              {isMoving ? (
                <Select
                  onValueChange={(value) => {
                    moveToStage.mutate(value);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.stage_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsMoving(true)}
                >
                  <MoveRight className="h-4 w-4 mr-2" />
                  Move Stage
                </Button>
              )}

              <Button
                variant="default"
                onClick={() => updateStatus.mutate('hired')}
                disabled={updateStatus.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Hire
              </Button>

              <Button
                variant="destructive"
                onClick={() => updateStatus.mutate('rejected')}
                disabled={updateStatus.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
