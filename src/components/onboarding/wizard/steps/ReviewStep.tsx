import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Users, Calendar, FileText, PlayCircle, BookOpen, CheckSquare } from 'lucide-react';
import { CreateOnboardingTemplateRequest } from '@/types/onboarding';
import { OnboardingStageFormData } from '@/types/onboarding';
import { OnboardingStepFormData } from '@/types/onboardingSteps';

interface ReviewStepProps {
  basicData: CreateOnboardingTemplateRequest;
  stages: OnboardingStageFormData[];
  stepsData: { [stageId: string]: OnboardingStepFormData[] };
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

export function ReviewStep({ basicData, stages, stepsData }: ReviewStepProps) {
  const getTotalSteps = () => {
    return Object.values(stepsData).reduce((total, steps) => total + steps.length, 0);
  };

  const getTotalDuration = () => {
    let total = 0;
    Object.values(stepsData).forEach(steps => {
      steps.forEach(step => {
        if (step.estimated_duration_minutes) {
          total += step.estimated_duration_minutes;
        }
      });
    });
    return total;
  };

  const getRequiredSteps = () => {
    let required = 0;
    Object.values(stepsData).forEach(steps => {
      steps.forEach(step => {
        if (step.is_required) required++;
      });
    });
    return required;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const totalSteps = getTotalSteps();
  const totalDuration = getTotalDuration();
  const requiredSteps = getRequiredSteps();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold">Review Your Template</h3>
        <p className="text-muted-foreground">
          Check everything looks correct before creating your onboarding template
        </p>
      </div>

      {/* Template Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{basicData.name}</CardTitle>
          {basicData.description && (
            <CardDescription>{basicData.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stages.length}</div>
              <div className="text-sm text-blue-800">Stages</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalSteps}</div>
              <div className="text-sm text-green-800">Total Steps</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{requiredSteps}</div>
              <div className="text-sm text-purple-800">Required</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{formatDuration(totalDuration)}</div>
              <div className="text-sm text-orange-800">Est. Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stages Overview */}
      <div className="space-y-4">
        <h4 className="font-medium">Stages & Steps</h4>
        {stages.map((stage, stageIndex) => {
          const stageSteps = stepsData[`stage-${stageIndex}`] || [];
          const stageDuration = stageSteps.reduce((total, step) => 
            total + (step.estimated_duration_minutes || 0), 0
          );

          return (
            <Card key={stageIndex}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                      {stageIndex + 1}
                    </div>
                    <div>
                      <CardTitle className="text-base">{stage.title}</CardTitle>
                      {stage.description && (
                        <CardDescription className="text-sm">{stage.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {stage.due_offset_days} days
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stageSteps.length} steps • {formatDuration(stageDuration)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              {stageSteps.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {stageSteps.map((step, stepIndex) => {
                      const Icon = stepTypeIcons[step.step_type];
                      return (
                        <div key={stepIndex} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {step.title || `Untitled Step ${stepIndex + 1}`}
                            </div>
                            {step.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {step.description}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {step.is_required && (
                              <Badge variant="secondary" className="text-xs">Required</Badge>
                            )}
                            {step.estimated_duration_minutes && (
                              <Badge variant="outline" className="text-xs">
                                {step.estimated_duration_minutes}m
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Validation Messages */}
      <div className="space-y-3">
        {totalSteps === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">No steps created</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Your template will be created, but you'll need to add steps later for it to be useful.
            </p>
          </div>
        )}
        
        {totalSteps < 5 && totalSteps > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Light onboarding template</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              You have {totalSteps} steps. Consider adding more detailed steps for a comprehensive onboarding experience.
            </p>
          </div>
        )}

        {totalSteps >= 5 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Well-structured template</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Great job! You have {totalSteps} steps across {stages.length} stages with an estimated duration of {formatDuration(totalDuration)}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}