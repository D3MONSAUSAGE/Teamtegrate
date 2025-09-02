import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  ArrowRight
} from 'lucide-react';
import { useOnboardingJourney } from '@/hooks/onboarding/useOnboardingJourney';
import { OnboardingStepCard } from './OnboardingStepCard';
import type { OnboardingInstanceStepProgress } from '@/types/onboardingSteps';

interface OnboardingJourneyProps {
  instanceId: string;
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
  locked: { icon: Lock, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  available: { icon: Play, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  in_progress: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  completed: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  skipped: { icon: ArrowRight, color: 'text-gray-600', bgColor: 'bg-gray-50' },
};

export function OnboardingJourney({ instanceId }: OnboardingJourneyProps) {
  const { journey, isLoading, startStep, completeStep } = useOnboardingJourney(instanceId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-full mb-2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!journey) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No onboarding journey found.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                Welcome to {journey.instance.template?.name || 'Your Onboarding'}
              </CardTitle>
              {journey.instance.template?.description && (
                <p className="text-muted-foreground mt-2">
                  {journey.instance.template.description}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {Math.round(journey.progress.completionPercentage)}%
              </div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={journey.progress.completionPercentage} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{journey.progress.completedSteps} of {journey.progress.totalSteps} steps completed</span>
              <span>{journey.progress.availableSteps} steps available</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Highlight */}
      {journey.currentStep && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Clock className="h-5 w-5" />
              Current Step
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OnboardingStepCard
              step={journey.currentStep}
              onStart={() => startStep(journey.currentStep!.step_id)}
              onComplete={(data) => completeStep({
                stepId: journey.currentStep!.step_id,
                completionData: data.completionData,
                notes: data.notes,
              })}
              isHighlighted={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Stages and Steps */}
      <div className="space-y-6">
        {journey.stages.map((stage, stageIndex) => (
          <Card key={stage.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                  {stageIndex + 1}
                </Badge>
                {stage.title}
              </CardTitle>
              {stage.description && (
                <p className="text-muted-foreground">{stage.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stage.steps.map((stepProgress, stepIndex) => {
                  const isCurrentStep = journey.currentStep?.id === stepProgress.id;
                  
                  return (
                    <div key={stepProgress.id} className="relative">
                      {stepIndex > 0 && (
                        <div className="absolute left-4 -top-4 w-0.5 h-4 bg-border"></div>
                      )}
                      
                      <div className={`
                        rounded-lg border p-4 transition-all
                        ${isCurrentStep ? 'border-primary bg-primary/5' : 'border-border'}
                        ${stepProgress.status === 'locked' ? 'opacity-60' : 'opacity-100'}
                      `}>
                        <OnboardingStepCard
                          step={stepProgress}
                          onStart={() => startStep(stepProgress.step_id)}
                          onComplete={(data) => completeStep({
                            stepId: stepProgress.step_id,
                            completionData: data.completionData,
                            notes: data.notes,
                          })}
                          isHighlighted={isCurrentStep}
                          showFullContent={isCurrentStep}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Completion Message */}
      {journey.progress.completionPercentage === 100 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Congratulations! 🎉
              </h3>
              <p className="text-green-700">
                You have successfully completed your onboarding journey. 
                Welcome to the team!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}