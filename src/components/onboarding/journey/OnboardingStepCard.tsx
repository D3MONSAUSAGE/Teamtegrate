import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  Lock, 
  FileText, 
  PlayCircle, 
  BookOpen, 
  CheckSquare, 
  Users,
  ExternalLink,
  MessageSquare,
  Timer
} from 'lucide-react';
import type { OnboardingInstanceStepProgress } from '@/types/onboardingSteps';

interface OnboardingStepCardProps {
  step: OnboardingInstanceStepProgress;
  onStart: () => void;
  onComplete: (data: { completionData?: Record<string, any>; notes?: string }) => void;
  isHighlighted?: boolean;
  showFullContent?: boolean;
}

const stepTypeIcons = {
  document: FileText,
  video: PlayCircle,
  course: BookOpen,
  quiz: CheckSquare,
  task: Clock,
  meeting: Users,
  approval: CheckSquare,
};

const statusConfig = {
  locked: { icon: Lock, color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'Locked' },
  available: { icon: Play, color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Available' },
  in_progress: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50', label: 'In Progress' },
  completed: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', label: 'Completed' },
  skipped: { icon: CheckCircle, color: 'text-gray-600', bgColor: 'bg-gray-50', label: 'Skipped' },
};

export function OnboardingStepCard({ 
  step, 
  onStart, 
  onComplete, 
  isHighlighted = false,
  showFullContent = false 
}: OnboardingStepCardProps) {
  const [notes, setNotes] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  const stepTypeIcon = stepTypeIcons[step.step?.step_type as keyof typeof stepTypeIcons] || FileText;
  const statusInfo = statusConfig[step.status as keyof typeof statusConfig];
  const StepIcon = stepTypeIcon;
  const StatusIcon = statusInfo.icon;

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete({
        completionData: { completed_at: new Date().toISOString() },
        notes: notes.trim() || undefined
      });
    } finally {
      setIsCompleting(false);
      setNotes('');
    }
  };

  const renderStepContent = () => {
    if (!step.step?.content || step.step.content.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">Step Content:</h4>
        {step.step.content.map((content: any, index: number) => (
          <Card key={index} className="border-muted">
            <CardContent className="pt-3 pb-3">
              {content.content_type === 'text' && (
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm">{content.content_data.text}</p>
                </div>
              )}
              
              {(content.content_type === 'video' || 
                content.content_type === 'document' || 
                content.content_type === 'external_link') && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={content.content_data.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {content.content_data.title || content.content_data.url}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Step Header */}
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
          <StepIcon className={`h-5 w-5 ${statusInfo.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-base">{step.step?.title}</h3>
            <Badge variant={step.step?.is_required ? 'default' : 'secondary'} className="text-xs">
              {step.step?.is_required ? 'Required' : 'Optional'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>
          
          {step.step?.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {step.step.description}
            </p>
          )}
          
          {/* Step Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {step.step?.estimated_duration_minutes && (
              <div className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                {step.step.estimated_duration_minutes} min
              </div>
            )}
            
            {step.step?.step_type && (
              <div className="capitalize">
                {step.step.step_type.replace('_', ' ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step Content (expanded view) */}
      {(showFullContent || step.status === 'in_progress') && renderStepContent()}

      {/* Completion Section */}
      {step.status === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Completed</span>
            {step.completed_at && (
              <span className="text-xs text-green-600">
                on {new Date(step.completed_at).toLocaleDateString()}
              </span>
            )}
          </div>
          {step.notes && (
            <p className="text-sm text-green-700 mt-2">{step.notes}</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {step.status === 'available' && (
        <Button onClick={onStart} size="sm" className="w-full">
          <Play className="h-4 w-4 mr-2" />
          Start Step
        </Button>
      )}

      {step.status === 'in_progress' && (
        <div className="space-y-3">
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Add completion notes (optional):</span>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about completing this step..."
              rows={2}
              className="resize-none"
            />
            <Button 
              onClick={handleComplete}
              disabled={isCompleting}
              size="sm" 
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isCompleting ? 'Completing...' : 'Mark as Complete'}
            </Button>
          </div>
        </div>
      )}

      {step.status === 'locked' && (
        <div className="text-center text-sm text-muted-foreground py-2">
          <Lock className="h-4 w-4 mx-auto mb-1" />
          Complete previous steps to unlock
        </div>
      )}
    </div>
  );
}