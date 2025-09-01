import { useState } from 'react';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, CheckCircle, Clock, Users, FileText, Calendar } from 'lucide-react';
import { OnboardingTasks } from './OnboardingTasks';
import { OnboardingTimeline } from './OnboardingTimeline';
import { OnboardingChecklist } from './OnboardingChecklist';

export function OnboardingDashboard() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  
  const canManageOnboarding = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'manager';
  
  // Mock data - in real app this would come from API
  const onboardingStats = {
    totalNewHires: 5,
    completedOnboarding: 2,
    inProgress: 3,
    averageCompletionTime: 14,
    completionRate: 85
  };

  const recentNewHires = [
    { id: 1, name: 'Sarah Johnson', startDate: '2024-01-15', progress: 75, status: 'In Progress' },
    { id: 2, name: 'Mike Chen', startDate: '2024-01-10', progress: 100, status: 'Completed' },
    { id: 3, name: 'Emma Davis', startDate: '2024-01-08', progress: 45, status: 'In Progress' },
  ];

  if (!canManageOnboarding && user?.role !== 'user') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to access onboarding features.</p>
      </div>
    );
  }

  // If user is a regular employee, show their personal onboarding
  if (user?.role === 'user') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Welcome to the Team!</h2>
            <p className="text-muted-foreground">Complete your onboarding checklist to get started</p>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            <Clock className="w-4 h-4 mr-2" />
            Day 3 of 14
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Your Onboarding Progress
            </CardTitle>
            <CardDescription>Complete all tasks to finish your onboarding</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>65%</span>
                </div>
                <Progress value={65} className="h-3" />
              </div>
              <OnboardingChecklist />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Management view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Employee Onboarding</h2>
          <p className="text-muted-foreground">Manage and track new employee onboarding process</p>
        </div>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          New Employee
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Hires</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onboardingStats.totalNewHires}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onboardingStats.completedOnboarding}</div>
            <p className="text-xs text-muted-foreground">Finished onboarding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onboardingStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Currently onboarding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onboardingStats.averageCompletionTime}d</div>
            <p className="text-xs text-muted-foreground">To complete</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent New Hires</CardTitle>
              <CardDescription>Track onboarding progress for new team members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentNewHires.map((hire) => (
                  <div key={hire.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{hire.name}</p>
                      <p className="text-sm text-muted-foreground">Started {hire.startDate}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{hire.progress}%</p>
                        <Progress value={hire.progress} className="w-24 h-2" />
                      </div>
                      <Badge variant={hire.status === 'Completed' ? 'default' : 'secondary'}>
                        {hire.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <OnboardingTasks />
        </TabsContent>

        <TabsContent value="timeline">
          <OnboardingTimeline />
        </TabsContent>
      </Tabs>
    </div>
  );
}