import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useRecruitmentStageTransitions } from '@/hooks/recruitment/useRecruitmentStageTransitions';
import type { CandidateWithDetails } from '@/types/recruitment';

interface CandidateActivityTabProps {
  candidate: CandidateWithDetails;
}

export function CandidateActivityTab({ candidate }: CandidateActivityTabProps) {
  const { transitions, isLoading } = useRecruitmentStageTransitions(candidate.id);

  if (isLoading) {
    return <div className="text-center py-8">Loading activity...</div>;
  }

  if (transitions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No activity history yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Stage History</h3>

      <div className="relative space-y-4">
        {transitions.map((transition, index) => (
          <Card key={transition.id}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  {transition.from_stage && (
                    <>
                      <Badge
                        style={{ backgroundColor: transition.from_stage.color_code }}
                      >
                        {transition.from_stage.stage_name}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </>
                  )}
                  <Badge
                    style={{ backgroundColor: transition.to_stage.color_code }}
                  >
                    {transition.to_stage.stage_name}
                  </Badge>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium">
                    {format(new Date(transition.transition_date), 'PPP')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(transition.transition_date), 'p')}
                  </p>
                </div>
              </div>

              {transition.reason && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="text-sm">{transition.reason}</p>
                </div>
              )}

              {transition.automated && (
                <p className="text-xs text-muted-foreground mt-2">
                  Automated transition
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
