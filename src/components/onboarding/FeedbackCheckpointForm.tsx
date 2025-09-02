import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, Calendar, User } from 'lucide-react';
import { OnboardingFeedbackCheckpoint } from '@/types/onboarding';
import { useFeedbackCheckpointManagement } from '@/hooks/onboarding/useOnboardingFeedback';
import { format } from 'date-fns';

interface FeedbackCheckpointFormProps {
  checkpoint: OnboardingFeedbackCheckpoint & {
    instance?: {
      id: string;
      start_date: string;
      employee?: { id: string; name: string; email: string };
      template?: { id: string; name: string } | null;
    };
  };
  isEmployee?: boolean;
}

export const FeedbackCheckpointForm: React.FC<FeedbackCheckpointFormProps> = ({
  checkpoint,
  isEmployee = false,
}) => {
  const [rating, setRating] = useState(checkpoint.rating || 0);
  const [notes, setNotes] = useState(checkpoint.notes || '');
  const [hoveredRating, setHoveredRating] = useState(0);

  const { updateCheckpoint, isUpdating } = useFeedbackCheckpointManagement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      return;
    }

    await updateCheckpoint.mutateAsync({
      checkpointId: checkpoint.id,
      rating,
      notes: notes.trim() || undefined,
      status: 'completed',
    });
  };

  const isCompleted = checkpoint.status === 'completed';
  const canEdit = !isCompleted && (isEmployee || !isEmployee);

  // Calculate the expected date based on start date and offset
  const expectedDate = checkpoint.instance?.start_date 
    ? format(
        new Date(new Date(checkpoint.instance.start_date).getTime() + checkpoint.days_offset * 24 * 60 * 60 * 1000),
        'MMM d, yyyy'
      )
    : 'N/A';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {checkpoint.checkpoint_label || `${checkpoint.days_offset}-Day Check-in`}
          </CardTitle>
          <Badge variant={isCompleted ? "default" : "secondary"}>
            {isCompleted ? 'Completed' : 'Pending'}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Due: {expectedDate}
          </div>
          {checkpoint.instance?.employee && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Employee: {checkpoint.instance.employee.name}
            </div>
          )}
          {checkpoint.instance?.template && (
              <div className="text-xs text-muted-foreground">
                Template: {checkpoint.instance?.template?.name || 'No Template'}
              </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isCompleted ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rating</label>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= (checkpoint.rating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {checkpoint.rating}/5
                </span>
              </div>
            </div>
            
            {checkpoint.notes && (
              <div>
                <label className="text-sm font-medium">Feedback</label>
                <p className="mt-1 text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {checkpoint.notes}
                </p>
              </div>
            )}
            
            {checkpoint.completed_at && (
              <p className="text-xs text-muted-foreground">
                Completed on {format(new Date(checkpoint.completed_at), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        ) : canEdit ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                How would you rate your onboarding experience so far? *
              </label>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-0 border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary rounded"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground hover:text-yellow-400'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    {rating}/5
                  </span>
                )}
              </div>
              {rating === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Please select a rating to continue
                </p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium">
                Additional Feedback (Optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share your thoughts about the onboarding process, what's going well, what could be improved, or any questions you have..."
                className="mt-2"
                rows={4}
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={rating === 0 || isUpdating}
              className="w-full"
            >
              {isUpdating ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>This feedback checkpoint is not yet available for completion.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};