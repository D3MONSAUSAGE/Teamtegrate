import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Plus, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useRecruitmentInterviews } from '@/hooks/recruitment/useRecruitmentInterviews';
import { ScheduleInterviewDialog } from './ScheduleInterviewDialog';
import { InterviewFeedbackDialog } from './InterviewFeedbackDialog';
import type { CandidateWithDetails } from '@/types/recruitment';

interface CandidateInterviewsTabProps {
  candidate: CandidateWithDetails;
}

export function CandidateInterviewsTab({ candidate }: CandidateInterviewsTabProps) {
  const { interviews, isLoading } = useRecruitmentInterviews(candidate.id);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'no_show':
        return 'bg-orange-500';
      case 'rescheduled':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading interviews...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Interviews</h3>
        <Button onClick={() => setScheduleDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Interview
        </Button>
      </div>

      {interviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No interviews scheduled</p>
            <Button onClick={() => setScheduleDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule First Interview
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {interviews.map((interview) => (
            <Card key={interview.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{interview.interview_type}</CardTitle>
                      <Badge className={getStatusColor(interview.status)}>
                        {interview.status}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(interview.scheduled_date), 'PPP')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {format(new Date(interview.scheduled_date), 'p')} ({interview.duration_minutes} min)
                      </div>
                      {interview.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {interview.location}
                        </div>
                      )}
                    </div>
                  </div>
                  {interview.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedInterviewId(interview.id);
                        setFeedbackDialogOpen(true);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add Feedback
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <ScheduleInterviewDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        candidateId={candidate.id}
      />

      {selectedInterviewId && (
        <InterviewFeedbackDialog
          open={feedbackDialogOpen}
          onOpenChange={setFeedbackDialogOpen}
          interviewId={selectedInterviewId}
          candidateId={candidate.id}
        />
      )}
    </div>
  );
}
