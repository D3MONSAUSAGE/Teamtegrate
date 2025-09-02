import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, PlayCircle, BookOpen, CheckSquare, Users, Clock, Calendar } from 'lucide-react';
import { OnboardingStageFormData } from '@/types/onboarding';
import { OnboardingStepFormData } from '@/types/onboardingSteps';
import { VisualStepBuilder } from '../VisualStepBuilder';

interface StepsBuilderStepProps {
  stages: OnboardingStageFormData[];
  stepsData: { [stageId: string]: OnboardingStepFormData[] };
  onChange: (stepsData: { [stageId: string]: OnboardingStepFormData[] }) => void;
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

export function StepsBuilderStep({ stages, stepsData, onChange }: StepsBuilderStepProps) {
  const [activeStage, setActiveStage] = useState(0);
  
  const currentStageKey = `stage-${activeStage}`;
  const currentStageSteps = stepsData[currentStageKey] || [];

  const updateStageSteps = (stageIndex: number, steps: OnboardingStepFormData[]) => {
    const stageKey = `stage-${stageIndex}`;
    onChange({
      ...stepsData,
      [stageKey]: steps
    });
  };

  const addStepToStage = (stageIndex: number) => {
    const stageKey = `stage-${stageIndex}`;
    const existingSteps = stepsData[stageKey] || [];
    
    const newStep: OnboardingStepFormData = {
      title: '',
      description: '',
      step_type: 'document',
      is_required: true,
      estimated_duration_minutes: 30,
      due_offset_days: 1,
      prerequisites: [],
      content: [],
      requirements: [],
    };

    updateStageSteps(stageIndex, [...existingSteps, newStep]);
  };

  const getTotalStepsCount = () => {
    return Object.values(stepsData).reduce((total, steps) => total + steps.length, 0);
  };

  const getStageStepCounts = () => {
    return stages.map((_, index) => {
      const stageKey = `stage-${index}`;
      return stepsData[stageKey]?.length || 0;
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <CheckSquare className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Build Detailed Steps</h3>
        <p className="text-muted-foreground">
          Add specific activities, tasks, and content for each stage of the onboarding process
        </p>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{getTotalStepsCount()}</div>
                <div className="text-sm text-muted-foreground">Total Steps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stages.length}</div>
                <div className="text-sm text-muted-foreground">Stages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(getTotalStepsCount() / stages.length) || 0}
                </div>
                <div className="text-sm text-muted-foreground">Avg per Stage</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Recommended: 15-25 total steps</div>
              <div className="text-xs text-muted-foreground">3-8 steps per stage</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeStage.toString()} onValueChange={(v) => setActiveStage(parseInt(v))}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
          {stages.map((stage, index) => {
            const stepCount = getStageStepCounts()[index];
            return (
              <TabsTrigger key={index} value={index.toString()} className="flex flex-col gap-1 p-3">
                <span className="text-xs font-medium truncate">{stage.title}</span>
                <Badge variant={stepCount > 0 ? "default" : "secondary"} className="text-xs">
                  {stepCount} steps
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {stages.map((stage, stageIndex) => (
          <TabsContent key={stageIndex} value={stageIndex.toString()} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                        {stageIndex + 1}
                      </div>
                      {stage.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {stage.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {stage.due_offset_days} days
                    </Badge>
                    <Button size="sm" onClick={() => addStepToStage(stageIndex)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Step
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <VisualStepBuilder
                  steps={stepsData[`stage-${stageIndex}`] || []}
                  onChange={(steps) => updateStageSteps(stageIndex, steps)}
                  stageIndex={stageIndex}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {getTotalStepsCount() === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">No steps created yet</h3>
                <p className="text-sm text-muted-foreground">
                  Start by adding steps to your first stage above
                </p>
              </div>
              <Button onClick={() => addStepToStage(0)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Step
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium text-purple-900 mb-2">✨ Step Building Best Practices</h4>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Break complex tasks into smaller, manageable steps</li>
          <li>• Include clear instructions and expected outcomes</li>
          <li>• Add multimedia content (videos, documents) to enhance learning</li>
          <li>• Set realistic time estimates for each step</li>
          <li>• Use prerequisites to ensure logical progression</li>
        </ul>
      </div>
    </div>
  );
}