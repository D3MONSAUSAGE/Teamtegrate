import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  GraduationCap,
  Users,
  Heart,
  Trophy,
  MapPin,
  Clock,
  HelpCircle
} from 'lucide-react';
import { useMyOnboarding } from '@/hooks/onboarding/useOnboardingInstances';
import { useOnboardingInstanceTasks } from '@/hooks/onboarding/useOnboardingTasks';
import { OnboardingTaskCategory, OnboardingTaskStatus } from '@/types/onboarding';
import { WizardStepper } from './WizardStepper';
import { WizardTaskCard } from './WizardTaskCard';
import { WizardWelcome } from './WizardWelcome';
import { WizardCompletion } from './WizardCompletion';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface NewEmployeeWizardProps {
  onClose: () => void;
}

export function NewEmployeeWizard({ onClose }: NewEmployeeWizardProps) {
  const { data: onboardingInstance } = useMyOnboarding();
  const { tasks, updateTaskStatus, isUpdating } = useOnboardingInstanceTasks(
    onboardingInstance?.id || ''
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  // Group tasks by category and filter out completed ones
  const tasksByCategory = React.useMemo(() => {
    const categories = {
      hr_documentation: tasks.filter(t => t.category === 'hr_documentation' && t.status !== 'completed'),
      compliance_training: tasks.filter(t => t.category === 'compliance_training' && t.status !== 'completed'),
      job_specific_training: tasks.filter(t => t.category === 'job_specific_training' && t.status !== 'completed'),
      culture_engagement: tasks.filter(t => t.category === 'culture_engagement' && t.status !== 'completed'),
    };
    
    return Object.entries(categories).filter(([_, tasks]) => tasks.length > 0);
  }, [tasks]);

  const allIncompleteTasks = tasksByCategory.flatMap(([_, tasks]) => tasks);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Wizard steps: Welcome + Category steps + Completion
  const totalSteps = tasksByCategory.length + 2; // +2 for welcome and completion
  const isWelcomeStep = currentStep === 0;
  const isCompletionStep = currentStep === totalSteps - 1;
  const isTaskStep = currentStep > 0 && currentStep < totalSteps - 1;

  // Current category and task
  const currentCategory = isTaskStep ? tasksByCategory[currentStep - 1] : null;
  const currentCategoryTasks = currentCategory ? currentCategory[1] : [];
  const currentTask = currentCategoryTasks[currentTaskIndex];

  const getCategoryInfo = (category: OnboardingTaskCategory) => {
    switch (category) {
      case 'hr_documentation':
        return {
          title: 'HR Documentation',
          description: 'Complete essential paperwork and documentation',
          icon: FileText,
          color: 'from-blue-500 to-blue-400'
        };
      case 'compliance_training':
        return {
          title: 'Compliance Training',
          description: 'Complete required compliance and safety training',
          icon: GraduationCap,
          color: 'from-purple-500 to-purple-400'
        };
      case 'job_specific_training':
        return {
          title: 'Job-Specific Training',
          description: 'Learn your role-specific skills and processes',
          icon: Trophy,
          color: 'from-green-500 to-green-400'
        };
      case 'culture_engagement':
        return {
          title: 'Culture & Engagement',
          description: 'Connect with your team and learn company culture',
          icon: Heart,
          color: 'from-pink-500 to-pink-400'
        };
      default:
        return {
          title: 'General Tasks',
          description: 'Complete your onboarding tasks',
          icon: FileText,
          color: 'from-gray-500 to-gray-400'
        };
    }
  };

  const handleNext = () => {
    if (isTaskStep && currentTask && currentTaskIndex < currentCategoryTasks.length - 1) {
      // Move to next task in current category
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else if (isTaskStep && currentTaskIndex === currentCategoryTasks.length - 1) {
      // Move to next category
      setCurrentStep(currentStep + 1);
      setCurrentTaskIndex(0);
    } else {
      // Move to next step
      setCurrentStep(currentStep + 1);
      setCurrentTaskIndex(0);
    }
  };

  const handlePrevious = () => {
    if (isTaskStep && currentTaskIndex > 0) {
      // Move to previous task in current category
      setCurrentTaskIndex(currentTaskIndex - 1);
    } else if (currentStep > 0) {
      // Move to previous category
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      if (prevStep > 0 && prevStep < totalSteps - 1) {
        const prevCategory = tasksByCategory[prevStep - 1];
        setCurrentTaskIndex(prevCategory[1].length - 1);
      }
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await updateTaskStatus.mutateAsync({ taskId, status: 'completed' });
      toast.success('Task completed!');
      
      // Auto-advance after completing a task
      setTimeout(() => {
        if (currentTaskIndex < currentCategoryTasks.length - 1) {
          setCurrentTaskIndex(currentTaskIndex + 1);
        } else {
          handleNext();
        }
      }, 1000);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      await updateTaskStatus.mutateAsync({ taskId, status: 'in_progress' });
      toast.success('Task started!');
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Check if we should show completion step
  useEffect(() => {
    if (allIncompleteTasks.length === 0 && !isCompletionStep && currentStep > 0) {
      setCurrentStep(totalSteps - 1);
    }
  }, [allIncompleteTasks.length, isCompletionStep, currentStep, totalSteps]);

  if (!onboardingInstance) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Onboarding</h3>
          <p className="text-muted-foreground">
            You don't have an active onboarding process.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Welcome to Your Onboarding Journey! 🎉</h1>
        <p className="text-muted-foreground">
          Complete your setup step-by-step with our guided onboarding wizard
        </p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="font-semibold">Your Progress</span>
            </div>
            <Badge variant="secondary">
              {completedTasks} of {totalTasks} tasks completed
            </Badge>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            {Math.round(progressPercent)}% complete
          </p>
        </CardContent>
      </Card>

      {/* Step Progress */}
      <WizardStepper
        currentStep={currentStep}
        totalSteps={totalSteps}
        tasksByCategory={tasksByCategory}
        getCategoryInfo={getCategoryInfo}
      />

      {/* Main Content */}
      <Card className="min-h-[500px]">
        <CardContent className="p-8">
          {isWelcomeStep && (
            <WizardWelcome
              onboardingInstance={onboardingInstance}
              totalTasks={totalTasks}
              tasksByCategory={tasksByCategory}
              getCategoryInfo={getCategoryInfo}
            />
          )}

          {isTaskStep && currentTask && currentCategory && (
            <div className="space-y-6">
              {/* Category Header */}
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getCategoryInfo(currentCategory[0] as OnboardingTaskCategory).color} flex items-center justify-center`}>
                    {React.createElement(getCategoryInfo(currentCategory[0] as OnboardingTaskCategory).icon, {
                      className: "w-8 h-8 text-white"
                    })}
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{getCategoryInfo(currentCategory[0] as OnboardingTaskCategory).title}</h2>
                  <p className="text-muted-foreground">{getCategoryInfo(currentCategory[0] as OnboardingTaskCategory).description}</p>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span>Task {currentTaskIndex + 1} of {currentCategoryTasks.length}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>Category {currentStep} of {totalSteps - 2}</span>
                </div>
              </div>

              {/* Current Task */}
              <WizardTaskCard
                task={currentTask}
                onComplete={handleCompleteTask}
                onStart={handleStartTask}
                isUpdating={isUpdating}
              />
            </div>
          )}

          {isCompletionStep && (
            <WizardCompletion
              onboardingInstance={onboardingInstance}
              completedTasks={completedTasks}
              totalTasks={totalTasks}
              onClose={onClose}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      {!isCompletionStep && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <HelpCircle className="w-4 h-4 mr-2" />
              Need Help?
            </Button>
          </div>

          <Button
            onClick={handleNext}
            disabled={isTaskStep && currentTask?.status !== 'completed'}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}