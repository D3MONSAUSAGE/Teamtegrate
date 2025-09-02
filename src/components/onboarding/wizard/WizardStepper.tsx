import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle } from 'lucide-react';
import { OnboardingTaskCategory } from '@/types/onboarding';

interface WizardStepperProps {
  currentStep: number;
  totalSteps: number;
  tasksByCategory: [string, any[]][];
  getCategoryInfo: (category: OnboardingTaskCategory) => {
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    color: string;
  };
}

export function WizardStepper({ 
  currentStep, 
  totalSteps, 
  tasksByCategory,
  getCategoryInfo 
}: WizardStepperProps) {
  const steps = [
    { title: 'Welcome', type: 'welcome' },
    ...tasksByCategory.map(([category, tasks]) => ({
      title: getCategoryInfo(category as OnboardingTaskCategory).title,
      type: 'category',
      category,
      taskCount: tasks.length
    })),
    { title: 'Complete', type: 'completion' }
  ];

  return (
    <div className="relative">
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={index} className="flex flex-col items-center space-y-2 flex-1">
              {/* Step Circle */}
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isActive
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-background border-muted-foreground/30 text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`absolute top-5 left-10 h-0.5 transition-all duration-300 ${
                      index < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                    style={{ width: 'calc(100vw / ' + steps.length + ' - 2.5rem)' }}
                  />
                )}
              </div>

              {/* Step Label */}
              <div className="text-center space-y-1">
                <div
                  className={`text-sm font-medium transition-colors ${
                    isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </div>
                {step.type === 'category' && 'taskCount' in step && (
                  <Badge variant="secondary" className="text-xs">
                    {step.taskCount} tasks
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}