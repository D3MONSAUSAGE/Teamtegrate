import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StepContentModal } from './preview/StepContentModal';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Circle, 
  Lock, 
  Play, 
  Clock, 
  FileText, 
  Video, 
  BookOpen, 
  HelpCircle,
  Users,
  Target,
  Calendar
} from 'lucide-react';

interface StepContent {
  text?: string;
  videoUrl?: string;
  questions?: Array<{
    question: string;
    options: string[];
    correct: number;
  }>;
}

interface Step {
  id: number;
  title: string;
  type: string;
  status: string;
  duration: string;
  content?: StepContent;
  notes?: string;
}

interface Stage {
  id: number;
  title: string;
  description: string;
  progress: number;
  status: string;
  steps: Step[];
}

interface JourneyData {
  currentWeek: number;
  overallProgress: number;
  stages: Stage[];
}

interface EmployeeJourneyPreviewProps {
  template: any;
  onClose: () => void;
}

const stepTypeIcons = {
  document: FileText,
  video: Video,
  course: BookOpen,
  quiz: HelpCircle,
  meeting: Users,
  task: Target,
};

const initialJourneyData: JourneyData = {
  currentWeek: 2,
  overallProgress: 45,
  stages: [
    {
      id: 1,
      title: 'Week 1: Welcome & Setup',
      description: 'Get oriented and complete essential setup tasks',
      progress: 100,
      status: 'completed',
      steps: [
        { 
          id: 1, 
          title: 'Complete Digital Profile', 
          type: 'document', 
          status: 'completed', 
          duration: '15 min',
          content: { text: "Please complete your digital profile with accurate personal and professional information. This will help us personalize your onboarding experience and ensure you have access to all necessary systems and resources." }
        },
        { 
          id: 2, 
          title: 'Watch Welcome Video', 
          type: 'video', 
          status: 'completed', 
          duration: '10 min',
          content: { videoUrl: "welcome-video.mp4", text: "Watch our CEO's welcome message and get an overview of company culture, values, and what to expect in your first weeks." }
        },
        { 
          id: 3, 
          title: 'Review Employee Handbook', 
          type: 'document', 
          status: 'completed', 
          duration: '45 min',
          content: { text: "The employee handbook contains important information about company policies, procedures, benefits, and guidelines. Please review it thoroughly and reach out to HR with any questions." }
        },
        { 
          id: 4, 
          title: 'Meet Your Manager', 
          type: 'meeting', 
          status: 'completed', 
          duration: '60 min',
          content: { text: "Schedule and attend a one-on-one meeting with your direct manager to discuss role expectations, goals, and answer any questions you may have." }
        },
      ]
    },
    {
      id: 2,
      title: 'Week 2: Core Training',
      description: 'Complete fundamental training modules and assessments',
      progress: 67,
      status: 'in_progress',
      steps: [
        { 
          id: 5, 
          title: 'Complete Safety Training Course', 
          type: 'course', 
          status: 'completed', 
          duration: '90 min',
          content: { text: "This comprehensive course covers workplace safety protocols, emergency procedures, and best practices to ensure a safe working environment for everyone." }
        },
        { 
          id: 6, 
          title: 'Diversity & Inclusion Training', 
          type: 'course', 
          status: 'in_progress', 
          duration: '60 min',
          content: { text: "Learn about our commitment to diversity, equity, and inclusion, including unconscious bias awareness and creating an inclusive workplace for all team members." }
        },
        { 
          id: 7, 
          title: 'Knowledge Check Quiz', 
          type: 'quiz', 
          status: 'available', 
          duration: '20 min',
          content: {
            questions: [
              {
                question: "What should you do in case of a fire emergency?",
                options: ["Use the elevator to evacuate", "Follow the designated evacuation route", "Stay at your desk and wait", "Call your manager first"],
                correct: 1
              },
              {
                question: "Our company values include:",
                options: ["Innovation only", "Integrity, Innovation, and Inclusion", "Profit maximization", "Individual success"],
                correct: 1
              }
            ]
          }
        },
      ]
    },
    {
      id: 3,
      title: 'Week 3: Role Integration',
      description: 'Job-specific training and team integration',
      progress: 0,
      status: 'locked',
      steps: [
        { 
          id: 8, 
          title: 'Role-Specific Training', 
          type: 'course', 
          status: 'locked', 
          duration: '120 min',
          content: { text: "Deep dive into your specific role responsibilities, tools, processes, and expectations. This training is customized based on your position and department." }
        },
        { 
          id: 9, 
          title: 'Team Introduction Sessions', 
          type: 'meeting', 
          status: 'locked', 
          duration: '90 min',
          content: { text: "Meet your team members, understand team dynamics, and learn about ongoing projects. This includes both formal introductions and informal team building activities." }
        },
        { 
          id: 10, 
          title: 'Submit Required Documents', 
          type: 'document', 
          status: 'locked', 
          duration: '30 min',
          content: { text: "Submit any remaining required documentation such as certifications, references, or compliance forms needed for your role." }
        },
      ]
    },
    {
      id: 4,
      title: 'Week 4: Final Steps',
      description: 'Complete certification and feedback sessions',
      progress: 0,
      status: 'locked',
      steps: [
        { 
          id: 11, 
          title: 'Final Assessment', 
          type: 'quiz', 
          status: 'locked', 
          duration: '45 min',
          content: {
            questions: [
              {
                question: "What is the first step when starting a new project?",
                options: ["Start coding immediately", "Define requirements and scope", "Assign team members", "Set deadlines"],
                correct: 1
              }
            ]
          }
        },
        { 
          id: 12, 
          title: '30-Day Check-in Meeting', 
          type: 'meeting', 
          status: 'locked', 
          duration: '60 min',
          content: { text: "Reflect on your first month, discuss challenges and successes, and plan for continued growth and development." }
        },
        { 
          id: 13, 
          title: 'Complete Feedback Survey', 
          type: 'task', 
          status: 'locked', 
          duration: '15 min',
          content: { text: "Provide feedback on your onboarding experience to help us improve the process for future new hires." }
        },
      ]
    }
  ]
};

export function EmployeeJourneyPreview({ template, onClose }: EmployeeJourneyPreviewProps) {
  const [activeStage, setActiveStage] = useState('2');
  const [journeyData, setJourneyData] = useState(initialJourneyData);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const { toast } = useToast();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Play className="w-5 h-5 text-blue-500" />;
      case 'available':
        return <Circle className="w-5 h-5 text-muted-foreground" />;
      case 'locked':
        return <Lock className="w-5 h-5 text-muted-foreground/50" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'locked':
        return 'bg-muted/50 text-muted-foreground border-muted';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  // Calculate overall progress
  const calculateOverallProgress = useCallback(() => {
    const allSteps = journeyData.stages.flatMap(stage => stage.steps);
    const completedSteps = allSteps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / allSteps.length) * 100);
  }, [journeyData]);

  // Calculate stage progress
  const calculateStageProgress = useCallback((steps: any[]) => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / steps.length) * 100);
  }, []);

  // Update stage and overall status when steps change
  const updateStageStatus = useCallback((stageId: number) => {
    setJourneyData(prev => {
      const updatedStages = prev.stages.map(stage => {
        if (stage.id === stageId) {
          const progress = calculateStageProgress(stage.steps);
          let status = stage.status;
          
          if (progress === 100) {
            status = 'completed';
          } else if (progress > 0) {
            status = 'in_progress';
          }
          
          return { ...stage, progress, status };
        }
        return stage;
      });

      // Update subsequent stage status if current stage is completed
      const currentStageIndex = updatedStages.findIndex(s => s.id === stageId);
      if (currentStageIndex >= 0 && updatedStages[currentStageIndex].status === 'completed') {
        const nextStageIndex = currentStageIndex + 1;
        if (nextStageIndex < updatedStages.length && updatedStages[nextStageIndex].status === 'locked') {
          updatedStages[nextStageIndex] = {
            ...updatedStages[nextStageIndex],
            status: 'available',
            steps: updatedStages[nextStageIndex].steps.map((step, index) => ({
              ...step,
              status: index === 0 ? 'available' : 'locked'
            }))
          };
        }
      }

      return {
        ...prev,
        stages: updatedStages,
        overallProgress: calculateOverallProgress()
      };
    });
  }, [calculateStageProgress, calculateOverallProgress]);

  // Handle step actions
  const handleStartStep = useCallback((stepId: number) => {
    setJourneyData(prev => {
      const updatedStages = prev.stages.map(stage => ({
        ...stage,
        steps: stage.steps.map(step => 
          step.id === stepId 
            ? { ...step, status: 'in_progress' }
            : step
        )
      }));

      return { ...prev, stages: updatedStages };
    });

    toast({
      title: "Step Started",
      description: "You've started this step. Complete it when ready.",
    });
  }, [toast]);

  const handleCompleteStep = useCallback((stepId: number, notes?: string) => {
    setJourneyData(prev => {
      const updatedStages = prev.stages.map(stage => {
        const updatedSteps = stage.steps.map(step => {
          if (step.id === stepId) {
            return { ...step, status: 'completed', notes };
          }
          return step;
        });

        // Unlock next step in the same stage
        const completedStepIndex = updatedSteps.findIndex(s => s.id === stepId);
        if (completedStepIndex >= 0 && completedStepIndex < updatedSteps.length - 1) {
          const nextStep = updatedSteps[completedStepIndex + 1];
          if (nextStep.status === 'locked') {
            updatedSteps[completedStepIndex + 1] = {
              ...nextStep,
              status: 'available'
            };
          }
        }

        return { ...stage, steps: updatedSteps };
      });

      return { ...prev, stages: updatedStages };
    });

    // Find stage ID and update stage status
    const stage = journeyData.stages.find(stage => 
      stage.steps.some(step => step.id === stepId)
    );
    
    if (stage) {
      setTimeout(() => updateStageStatus(stage.id), 100);
    }

    toast({
      title: "Step Completed!",
      description: "Great job! You've completed this step.",
    });
  }, [journeyData.stages, updateStageStatus, toast]);

  const handleStepClick = useCallback((step: Step) => {
    if (step.status === 'locked') return;
    
    setSelectedStep(step);
    setIsStepModalOpen(true);
  }, []);

  const totalSteps = journeyData.stages.flatMap(stage => stage.steps).length;
  const completedStepsCount = journeyData.stages.flatMap(stage => stage.steps)
    .filter(step => step.status === 'completed').length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-sm text-primary">
          <Play className="w-4 h-4" />
          Employee Preview Mode
        </div>
        <h1 className="text-2xl font-bold">Welcome to Your Onboarding Journey</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Complete your onboarding step-by-step. Each stage builds upon the previous one, 
          unlocking new content as you progress through your first month.
        </p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Overall Progress</h3>
              <p className="text-sm text-muted-foreground">
                Week {journeyData.currentWeek} of 4 • {completedStepsCount} of {totalSteps} steps completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{calculateOverallProgress()}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
          <Progress value={calculateOverallProgress()} className="h-3" />
        </CardContent>
      </Card>

      {/* Stage Navigation */}
      <Tabs value={activeStage} onValueChange={setActiveStage}>
        <TabsList className="grid w-full grid-cols-4">
          {journeyData.stages.map((stage) => (
            <TabsTrigger 
              key={stage.id} 
              value={stage.id.toString()}
              className="text-xs"
              disabled={stage.status === 'locked'}
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(stage.status)}
                Week {stage.id}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {journeyData.stages.map((stage) => (
          <TabsContent key={stage.id} value={stage.id.toString()} className="space-y-4">
            {/* Stage Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-3">
                      {getStatusIcon(stage.status)}
                      {stage.title}
                    </CardTitle>
                    <CardDescription>{stage.description}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(stage.status)}>
                    {stage.status === 'in_progress' ? 'Current' : 
                     stage.status === 'completed' ? 'Completed' : 
                     stage.status === 'locked' ? 'Locked' : 'Available'}
                  </Badge>
                </div>
                {stage.progress > 0 && (
                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Stage Progress</span>
                      <span className="text-sm text-muted-foreground">{stage.progress}%</span>
                    </div>
                    <Progress value={stage.progress} className="h-2" />
                  </div>
                )}
              </CardHeader>
            </Card>

            {/* Steps */}
            <div className="space-y-3">
              {stage.steps.map((step, index) => {
                const IconComponent = stepTypeIcons[step.type as keyof typeof stepTypeIcons] || Target;
                
                return (
                  <Card 
                    key={step.id}
                    className={`transition-all cursor-pointer hover:shadow-md ${
                      step.status === 'locked' 
                        ? 'opacity-50 cursor-not-allowed' 
                        : step.status === 'in_progress' 
                        ? 'ring-2 ring-primary/20 border-primary/30' 
                        : ''
                    }`}
                    onClick={() => handleStepClick(step)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{step.title}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {step.duration}
                              </div>
                              <Badge variant="outline" className="text-xs capitalize">
                                {step.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {getStatusIcon(step.status)}
                          {step.status === 'in_progress' && (
                            <Button 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStepClick(step);
                              }}
                            >
                              Continue
                            </Button>
                          )}
                          {step.status === 'available' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStepClick(step);
                              }}
                            >
                              Start
                            </Button>
                          )}
                          {step.status === 'completed' && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStepClick(step);
                              }}
                            >
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-center pt-6">
        <Button onClick={onClose} variant="outline">
          Close Preview
        </Button>
      </div>

      <StepContentModal
        step={selectedStep}
        open={isStepModalOpen}
        onClose={() => {
          setIsStepModalOpen(false);
          setSelectedStep(null);
        }}
        onComplete={handleCompleteStep}
        onStart={handleStartStep}
      />
    </div>
  );
}