import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useRecruitmentPipeline } from '@/hooks/recruitment/useRecruitmentPipeline';
import { useRecruitmentCandidates } from '@/hooks/recruitment/useRecruitmentCandidates';
import { CandidateCard } from './CandidateCard';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface RecruitmentKanbanBoardProps {
  positionId?: string;
  onCandidateClick?: (candidateId: string) => void;
}

export function RecruitmentKanbanBoard({ positionId, onCandidateClick }: RecruitmentKanbanBoardProps) {
  const { stages, isLoading: stagesLoading } = useRecruitmentPipeline();
  const { candidates, isLoading: candidatesLoading, moveCandidateToStage, isMoving } = useRecruitmentCandidates({
    positionId,
  });

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result;
    
    if (!destination || isMoving) return;
    
    const candidateId = draggableId;
    const newStageId = destination.droppableId;
    
    moveCandidateToStage({ candidateId, newStageId });
  };

  if (stagesLoading || candidatesLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 w-80">
            <Skeleton className="h-12 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const getCandidatesForStage = (stageId: string) => {
    return candidates.filter(c => c.current_stage_id === stageId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageCandidates = getCandidatesForStage(stage.id);
          
          return (
            <div key={stage.id} className="flex-shrink-0 w-80">
              <div 
                className="rounded-lg p-3 mb-4"
                style={{ backgroundColor: `${stage.color_code}15` }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{stage.stage_name}</h3>
                  <Badge variant="secondary">{stageCandidates.length}</Badge>
                </div>
              </div>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[200px] rounded-lg p-2 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-accent' : 'bg-background'
                    }`}
                  >
                    {stageCandidates.map((candidate, index) => (
                      <Draggable
                        key={candidate.id}
                        draggableId={candidate.id}
                        index={index}
                        isDragDisabled={isMoving}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={provided.draggableProps.style}
                          >
                            <CandidateCard
                              candidate={candidate}
                              isDragging={snapshot.isDragging}
                              onClick={() => onCandidateClick?.(candidate.id)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {stageCandidates.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-center text-muted-foreground text-sm py-8">
                        No candidates
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
