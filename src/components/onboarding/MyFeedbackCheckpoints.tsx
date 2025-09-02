import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { useMyPendingFeedback } from '@/hooks/onboarding/useOnboardingFeedback';
import { FeedbackCheckpointForm } from './FeedbackCheckpointForm';

export const MyFeedbackCheckpoints: React.FC = () => {
  const { data: pendingFeedback, isLoading, error } = useMyPendingFeedback();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading feedback checkpoints...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">Error loading feedback checkpoints: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!pendingFeedback || pendingFeedback.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            My Feedback Checkpoints
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
          <p className="text-muted-foreground">
            You don't have any pending feedback checkpoints at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Feedback Checkpoints</h2>
          <p className="text-muted-foreground">
            Share your onboarding experience and help us improve
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {pendingFeedback.length} pending
        </Badge>
      </div>

      <div className="grid gap-6">
        {pendingFeedback.map((checkpoint) => (
            <FeedbackCheckpointForm
              key={checkpoint.id}
              checkpoint={{
                ...checkpoint,
                instance: checkpoint.instance || undefined
              }}
              isEmployee={true}
            />
        ))}
      </div>
    </div>
  );
};