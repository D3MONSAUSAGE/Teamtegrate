import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Award, BookOpen, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { ComprehensiveProfile } from '@/hooks/useEnhancedProfile';

interface TrainingProgressSectionProps {
  profile: ComprehensiveProfile;
}

const TrainingProgressSection: React.FC<TrainingProgressSectionProps> = ({ profile }) => {
  const { trainings } = profile;

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            In Progress
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <BookOpen className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCompletionProgress = () => {
    const completed = trainings.filter(t => t.status === 'completed').length;
    const total = trainings.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const completedTrainings = trainings.filter(t => t.status === 'completed');
  const inProgressTrainings = trainings.filter(t => t.status === 'in_progress');
  const pendingTrainings = trainings.filter(t => t.status === 'pending');
  const overdueTrainings = trainings.filter(t => t.status === 'overdue');

  const averageScore = completedTrainings.length > 0 
    ? Math.round(completedTrainings.reduce((sum, t) => sum + (t.completion_score || 0), 0) / completedTrainings.length)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Award className="h-5 w-5" />
          Training & Certifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Training Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">{completedTrainings.length}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{inProgressTrainings.length}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{pendingTrainings.length}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-red-600">{overdueTrainings.length}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{getCompletionProgress()}%</span>
            </div>
            <Progress value={getCompletionProgress()} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Average Score</span>
              <span className="text-sm text-muted-foreground">{averageScore}%</span>
            </div>
            <Progress value={averageScore} className="h-2" />
          </div>
        </div>

        {/* Training List */}
        {trainings.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-muted-foreground">No training assignments yet.</div>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-semibold">Training History</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {trainings.map((training) => (
                <div key={training.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium">{training.content_title}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {training.assignment_type.replace('_', ' ')}
                      </div>
                    </div>
                    {getStatusBadge(training.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                    {training.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(training.due_date).toLocaleDateString()}
                      </div>
                    )}
                    {training.completed_at && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Completed: {new Date(training.completed_at).toLocaleDateString()}
                      </div>
                    )}
                    {training.completion_score !== null && training.completion_score !== undefined && (
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        Score: {training.completion_score}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrainingProgressSection;