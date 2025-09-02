import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  Calendar,
  Target,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';
import { OnboardingTaskCategory } from '@/types/onboarding';
import { format, differenceInDays } from 'date-fns';

interface WizardWelcomeProps {
  onboardingInstance: any;
  totalTasks: number;
  tasksByCategory: [string, any[]][];
  getCategoryInfo: (category: OnboardingTaskCategory) => {
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    color: string;
  };
}

export function WizardWelcome({ 
  onboardingInstance, 
  totalTasks, 
  tasksByCategory,
  getCategoryInfo 
}: WizardWelcomeProps) {
  const daysActive = differenceInDays(new Date(), new Date(onboardingInstance.start_date));
  const estimatedDuration = onboardingInstance.expected_duration_days || 30;

  return (
    <div className="space-y-8 text-center">
      {/* Hero Section */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Welcome to your personalized onboarding journey! We've prepared a step-by-step guide 
            to help you complete everything you need to get fully set up in your new role.
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <span className="font-semibold">Total Tasks</span>
              </div>
              <div className="text-2xl font-bold text-primary">{totalTasks}</div>
              <p className="text-sm text-muted-foreground">Items to complete</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">Timeline</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{estimatedDuration} days</div>
              <p className="text-sm text-muted-foreground">Expected duration</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="font-semibold">Day</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{daysActive + 1}</div>
              <p className="text-sm text-muted-foreground">Of your journey</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journey Overview */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold mb-2">Your Onboarding Journey</h3>
          <p className="text-muted-foreground">
            Here's what we'll cover together in this guided experience:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasksByCategory.map(([category, tasks], index) => {
            const categoryInfo = getCategoryInfo(category as OnboardingTaskCategory);
            const CategoryIcon = categoryInfo.icon;
            
            return (
              <Card key={category} className="text-left">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${categoryInfo.color} flex items-center justify-center`}>
                      <CategoryIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{categoryInfo.title}</h4>
                        <Badge variant="secondary">{tasks.length} tasks</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {categoryInfo.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Process Info */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">How This Works</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mx-auto">
                  1
                </div>
                <h4 className="font-medium">Focus on One Task</h4>
                <p className="text-muted-foreground">
                  We'll guide you through each task one at a time, so you're never overwhelmed.
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mx-auto">
                  2
                </div>
                <h4 className="font-medium">Complete at Your Pace</h4>
                <p className="text-muted-foreground">
                  Take breaks whenever you need to. Your progress is automatically saved.
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mx-auto">
                  3
                </div>
                <h4 className="font-medium">Get Help When Needed</h4>
                <p className="text-muted-foreground">
                  Questions? Reach out to your manager or HR team anytime during the process.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Info */}
      {onboardingInstance.template && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Following the <strong>{onboardingInstance.template.name}</strong> onboarding template
          </p>
          <p className="text-xs text-muted-foreground">
            Started on {format(new Date(onboardingInstance.start_date), 'MMMM d, yyyy')}
          </p>
        </div>
      )}
    </div>
  );
}