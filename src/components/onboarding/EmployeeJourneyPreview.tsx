import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const mockJourneyData = {
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
        { id: 1, title: 'Complete Digital Profile', type: 'document', status: 'completed', duration: '15 min' },
        { id: 2, title: 'Watch Welcome Video', type: 'video', status: 'completed', duration: '10 min' },
        { id: 3, title: 'Review Employee Handbook', type: 'document', status: 'completed', duration: '45 min' },
        { id: 4, title: 'Meet Your Manager', type: 'meeting', status: 'completed', duration: '60 min' },
      ]
    },
    {
      id: 2,
      title: 'Week 2: Core Training',
      description: 'Complete fundamental training modules and assessments',
      progress: 67,
      status: 'in_progress',
      steps: [
        { id: 5, title: 'Complete Safety Training Course', type: 'course', status: 'completed', duration: '90 min' },
        { id: 6, title: 'Diversity & Inclusion Training', type: 'course', status: 'in_progress', duration: '60 min' },
        { id: 7, title: 'Knowledge Check Quiz', type: 'quiz', status: 'available', duration: '20 min' },
      ]
    },
    {
      id: 3,
      title: 'Week 3: Role Integration',
      description: 'Job-specific training and team integration',
      progress: 0,
      status: 'locked',
      steps: [
        { id: 8, title: 'Role-Specific Training', type: 'course', status: 'locked', duration: '120 min' },
        { id: 9, title: 'Team Introduction Sessions', type: 'meeting', status: 'locked', duration: '90 min' },
        { id: 10, title: 'Submit Required Documents', type: 'document', status: 'locked', duration: '30 min' },
      ]
    },
    {
      id: 4,
      title: 'Week 4: Final Steps',
      description: 'Complete certification and feedback sessions',
      progress: 0,
      status: 'locked',
      steps: [
        { id: 11, title: 'Final Assessment', type: 'quiz', status: 'locked', duration: '45 min' },
        { id: 12, title: '30-Day Check-in Meeting', type: 'meeting', status: 'locked', duration: '60 min' },
        { id: 13, title: 'Complete Feedback Survey', type: 'task', status: 'locked', duration: '15 min' },
      ]
    }
  ]
};

export function EmployeeJourneyPreview({ template, onClose }: EmployeeJourneyPreviewProps) {
  const [activeStage, setActiveStage] = useState('2');

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
                Week {mockJourneyData.currentWeek} of 4 • 6 of 13 steps completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{mockJourneyData.overallProgress}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
          <Progress value={mockJourneyData.overallProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Stage Navigation */}
      <Tabs value={activeStage} onValueChange={setActiveStage}>
        <TabsList className="grid w-full grid-cols-4">
          {mockJourneyData.stages.map((stage) => (
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

        {mockJourneyData.stages.map((stage) => (
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
                    className={`transition-all ${
                      step.status === 'locked' 
                        ? 'opacity-50' 
                        : step.status === 'in_progress' 
                        ? 'ring-2 ring-primary/20 border-primary/30' 
                        : ''
                    }`}
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
                            <Button size="sm">Continue</Button>
                          )}
                          {step.status === 'available' && (
                            <Button size="sm" variant="outline">Start</Button>
                          )}
                          {step.status === 'completed' && (
                            <Button size="sm" variant="ghost">Review</Button>
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
    </div>
  );
}