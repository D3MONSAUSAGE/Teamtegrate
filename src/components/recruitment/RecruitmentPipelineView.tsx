import { useState } from 'react';
import { useRecruitmentPipeline } from '@/hooks/recruitment/useRecruitmentPipeline';
import { useRecruitmentCandidates } from '@/hooks/recruitment/useRecruitmentCandidates';
import { CandidateCard } from './CandidateCard';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecruitmentPipelineViewProps {
  positionId?: string;
  onCandidateClick?: (candidateId: string) => void;
  statusFilter?: 'active' | 'rejected' | 'hired';
}

export function RecruitmentPipelineView({ 
  positionId, 
  onCandidateClick, 
  statusFilter = 'active' 
}: RecruitmentPipelineViewProps) {
  const { stages, isLoading: stagesLoading } = useRecruitmentPipeline();
  const { candidates, isLoading: candidatesLoading } = useRecruitmentCandidates({
    positionId,
    status: statusFilter,
  });

  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  if (stagesLoading || candidatesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  const currentStageId = selectedStageId || stages[0]?.id;
  const currentStageIndex = stages.findIndex(s => s.id === currentStageId);

  const getCandidatesForStage = (stageId: string) => {
    return candidates.filter(c => c.current_stage_id === stageId);
  };

  const stageCandidates = getCandidatesForStage(currentStageId);

  return (
    <div className="space-y-6">
      {/* Stage Stepper - Horizontal Scrollable */}
      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <div className="relative p-4">
          <div className="flex items-center gap-4 min-w-max">
            {stages.map((stage, index) => {
              const stageCount = getCandidatesForStage(stage.id).length;
              const isActive = stage.id === currentStageId;
              const isPast = index < currentStageIndex;
              const isLast = index === stages.length - 1;

              return (
                <div key={stage.id} className="flex items-center">
                  <button
                    onClick={() => setSelectedStageId(stage.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 group transition-all",
                      "hover:scale-105 min-w-[100px]"
                    )}
                  >
                    {/* Stage Circle */}
                    <div className="relative flex items-center justify-center">
                      <div
                        className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center transition-all",
                          "border-2 relative z-10",
                          isActive && "ring-4 ring-primary/20 scale-110",
                          isPast && "bg-primary border-primary",
                          !isPast && !isActive && "bg-background border-muted",
                          isActive && "border-primary bg-primary/10"
                        )}
                        style={{
                          borderColor: isActive || isPast ? stage.color_code : undefined,
                          backgroundColor: isPast ? stage.color_code : isActive ? `${stage.color_code}20` : undefined,
                        }}
                      >
                        {isPast ? (
                          <Check className="w-6 h-6 text-white" />
                        ) : (
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "h-8 w-8 rounded-full p-0 flex items-center justify-center text-base font-bold",
                              isActive && "bg-primary text-primary-foreground"
                            )}
                          >
                            {stageCount}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Stage Name */}
                    <div className="text-center">
                      <p className={cn(
                        "text-sm font-medium transition-colors whitespace-normal max-w-[100px]",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {stage.stage_name}
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {stageCount} {stageCount === 1 ? 'candidate' : 'candidates'}
                      </p>
                    </div>
                  </button>

                  {/* Connector Arrow */}
                  {!isLast && (
                    <div className="flex items-center justify-center w-8 h-16 -mx-2">
                      <ArrowRight 
                        className={cn(
                          "w-5 h-5 transition-colors",
                          isPast ? "text-primary" : "text-muted"
                        )}
                        style={{ color: isPast ? stage.color_code : undefined }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Candidates Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {stages.find(s => s.id === currentStageId)?.stage_name} Stage
          </h3>
          <Badge variant="outline">
            {stageCandidates.length} {stageCandidates.length === 1 ? 'Candidate' : 'Candidates'}
          </Badge>
        </div>

        {stageCandidates.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No candidates in this stage</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stageCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                isDragging={false}
                onClick={() => onCandidateClick?.(candidate.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
