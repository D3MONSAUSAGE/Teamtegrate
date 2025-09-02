import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Trophy,
  Sparkles,
  CheckCircle,
  Calendar,
  PartyPopper,
  ArrowRight,
  Users,
  Home
} from 'lucide-react';
import { format } from 'date-fns';

interface WizardCompletionProps {
  onboardingInstance: any;
  completedTasks: number;
  totalTasks: number;
  onClose: () => void;
}

export function WizardCompletion({ 
  onboardingInstance, 
  completedTasks, 
  totalTasks, 
  onClose 
}: WizardCompletionProps) {
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const isFullyComplete = completionRate === 100;

  return (
    <div className="space-y-8 text-center">
      {/* Celebration Header */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-green-400 rounded-full flex items-center justify-center">
              {isFullyComplete ? (
                <Trophy className="w-12 h-12 text-white" />
              ) : (
                <CheckCircle className="w-12 h-12 text-white" />
              )}
            </div>
            <div className="absolute -top-2 -right-2">
              <PartyPopper className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">
            {isFullyComplete ? 'Congratulations! 🎉' : 'Great Progress! 🌟'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isFullyComplete 
              ? "You've successfully completed your onboarding journey! You're now fully set up and ready to make an impact in your new role."
              : "You've made excellent progress on your onboarding. You can continue with the remaining tasks anytime."
            }
          </p>
        </div>
      </div>

      {/* Completion Stats */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold">Tasks Completed</span>
              </div>
              <div className="text-3xl font-bold text-green-600">{completedTasks}</div>
              <p className="text-sm text-muted-foreground">Out of {totalTasks} total tasks</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">Completion Rate</span>
              </div>
              <div className="text-3xl font-bold text-blue-600">{Math.round(completionRate)}%</div>
              <p className="text-sm text-muted-foreground">Of your onboarding</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="font-semibold">Started</span>
              </div>
              <div className="text-lg font-bold text-purple-600">
                {format(new Date(onboardingInstance.start_date), 'MMM d')}
              </div>
              <p className="text-sm text-muted-foreground">Your journey began</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Badge */}
      {isFullyComplete && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-600" />
              <div className="text-left">
                <h3 className="font-bold text-yellow-800">Onboarding Champion!</h3>
                <p className="text-sm text-yellow-700">
                  You've completed all your onboarding tasks. Welcome to the team!
                </p>
              </div>
              <Badge className="bg-yellow-500 text-white">Complete</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          {isFullyComplete ? "What's Next?" : "Ready to Continue?"}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClose}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold">Return to Dashboard</h4>
                  <p className="text-sm text-muted-foreground">
                    Go back to your main dashboard
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold">Meet Your Team</h4>
                  <p className="text-sm text-muted-foreground">
                    Connect with your colleagues
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Call to Action */}
      <div className="space-y-4">
        <Button onClick={onClose} size="lg" className="px-8">
          <Home className="w-4 h-4 mr-2" />
          Return to Dashboard
        </Button>
        
        {!isFullyComplete && (
          <p className="text-sm text-muted-foreground">
            Don't worry! You can return to complete the remaining tasks anytime from your onboarding dashboard.
          </p>
        )}
      </div>

      {/* Appreciation Message */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Thank You!
            </h3>
            <p className="text-sm text-muted-foreground">
              {isFullyComplete 
                ? "Your dedication to completing the onboarding process shows your commitment to excellence. We're excited to have you on the team!"
                : "We appreciate the effort you've put into your onboarding so far. Take your time with the remaining tasks, and remember that we're here to support you every step of the way."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}