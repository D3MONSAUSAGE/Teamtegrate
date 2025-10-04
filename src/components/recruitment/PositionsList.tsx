import { useRecruitmentPositions } from '@/hooks/recruitment/useRecruitmentPositions';
import { PositionCard } from './PositionCard';
import { CreatePositionDialog } from './CreatePositionDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface PositionsListProps {
  onViewCandidates?: (positionId: string) => void;
}

export function PositionsList({ onViewCandidates }: PositionsListProps) {
  const { positions, isLoading, error } = useRecruitmentPositions();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Open Positions</h2>
        <CreatePositionDialog />
      </div>

      {positions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No positions yet</p>
          <CreatePositionDialog />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {positions.map((position) => (
            <PositionCard
              key={position.id}
              position={position}
              onViewCandidates={onViewCandidates}
            />
          ))}
        </div>
      )}
    </div>
  );
}
