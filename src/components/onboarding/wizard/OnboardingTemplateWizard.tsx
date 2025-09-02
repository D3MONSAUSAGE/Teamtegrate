import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, ArrowLeft, ArrowRight } from 'lucide-react';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { StagesStep } from './steps/StagesStep';
import { StepsBuilderStep } from './steps/StepsBuilderStep';
import { ReviewStep } from './steps/ReviewStep';
import { AssignmentStep } from './steps/AssignmentStep';
import { useOnboardingTemplates } from '@/hooks/onboarding/useOnboardingTemplates';
import { useOnboardingSteps } from '@/hooks/onboarding/useOnboardingSteps';
import { CreateOnboardingTemplateRequest } from '@/types/onboarding';
import { OnboardingStageFormData } from '@/types/onboarding';
import { OnboardingStepFormData } from '@/types/onboardingSteps';
import { toast } from 'sonner';

interface OnboardingTemplateWizardProps {
  open: boolean;
  onClose: () => void;
  editingTemplate?: any;
}

type WizardStep = 'basic' | 'stages' | 'steps' | 'review' | 'assign';

interface WizardData {
  basic: CreateOnboardingTemplateRequest;
  stages: OnboardingStageFormData[];
  steps: { [stageId: string]: OnboardingStepFormData[] };
  assignment: {
    employees: string[];
    startDate: string;
  };
}

const steps: { key: WizardStep; title: string; description: string }[] = [
  { key: 'basic', title: 'Basic Info', description: 'Template name and details' },
  { key: 'stages', title: 'Stages', description: 'Onboarding phases' },
  { key: 'steps', title: 'Steps', description: 'Detailed activities' },
  { key: 'review', title: 'Review', description: 'Confirm your template' },
  { key: 'assign', title: 'Assign', description: 'Assign to employees' },
];

export function OnboardingTemplateWizard({ open, onClose, editingTemplate }: OnboardingTemplateWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [wizardData, setWizardData] = useState<WizardData>({
    basic: { name: '', description: '', role_id: undefined },
    stages: [
      { title: 'Week 1: Getting Started', description: 'Initial setup and orientation', order_index: 0, due_offset_days: 7 },
      { title: 'Week 2: Role Training', description: 'Job-specific training and skills', order_index: 1, due_offset_days: 14 },
      { title: 'Week 3: Integration', description: 'Team integration and final steps', order_index: 2, due_offset_days: 21 },
    ],
    steps: {},
    assignment: { employees: [], startDate: '' },
  });

  const [createdTemplate, setCreatedTemplate] = useState<any>(null);
  const { createTemplate, isCreating } = useOnboardingTemplates();

  const stepIndex = steps.findIndex(s => s.key === currentStep);
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 'basic':
        return wizardData.basic.name.trim() !== '';
      case 'stages':
        return wizardData.stages.length > 0 && wizardData.stages.every(s => s.title.trim() !== '');
      case 'steps':
        return Object.keys(wizardData.steps).length > 0;
      case 'review':
        return true;
      case 'assign':
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep === 'review') {
      handleCreateTemplate();
      return;
    }
    
    const nextIndex = stepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const prevStep = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const template = await createTemplate.mutateAsync(wizardData.basic);
      setCreatedTemplate(template);
      setCurrentStep('assign');
      toast.success('Template created! Now you can assign it to employees.');
    } catch (error) {
      toast.error('Failed to create template');
    }
  };

  const updateWizardData = <K extends keyof WizardData>(
    key: K,
    value: WizardData[K]
  ) => {
    setWizardData(prev => ({ ...prev, [key]: value }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <BasicInfoStep
            data={wizardData.basic}
            onChange={(data) => updateWizardData('basic', data)}
          />
        );
      case 'stages':
        return (
          <StagesStep
            data={wizardData.stages}
            onChange={(data) => updateWizardData('stages', data)}
          />
        );
      case 'steps':
        return (
          <StepsBuilderStep
            stages={wizardData.stages}
            stepsData={wizardData.steps}
            onChange={(data) => updateWizardData('steps', data)}
          />
        );
      case 'review':
        return (
          <ReviewStep
            basicData={wizardData.basic}
            stages={wizardData.stages}
            stepsData={wizardData.steps}
          />
        );
      case 'assign':
        return (
          <AssignmentStep
            template={createdTemplate}
            onAssignmentComplete={onClose}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl">Create Onboarding Template</DialogTitle>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Step {stepIndex + 1} of {steps.length}
              </span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        {/* Step Navigation */}
        <div className="flex items-center gap-4 py-4 border-b overflow-x-auto">
          {steps.map((step, index) => {
            const isActive = step.key === currentStep;
            const isCompleted = index < stepIndex;
            const isAccessible = index <= stepIndex;

            return (
              <button
                key={step.key}
                onClick={() => isAccessible && setCurrentStep(step.key)}
                disabled={!isAccessible}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isCompleted
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : isAccessible
                    ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                    : 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                <div className="text-left">
                  <div className="font-medium">{step.title}</div>
                  <div className="text-xs opacity-70">{step.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={stepIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep !== 'assign' && (
            <Button
              onClick={nextStep}
              disabled={!canProceed() || (currentStep === 'review' && isCreating)}
            >
              {currentStep === 'review' ? (
                isCreating ? 'Creating Template...' : 'Create Template'
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}