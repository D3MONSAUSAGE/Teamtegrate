import { useState } from 'react';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, CheckCircle, Clock, Users, FileText, Calendar, Settings } from 'lucide-react';
import { OnboardingTemplateManager } from '@/components/onboarding/OnboardingTemplateManager';
import { OnboardingInstanceManager } from '@/components/onboarding/OnboardingInstanceManager';
import { MyOnboarding } from '@/components/onboarding/MyOnboarding';

export function OnboardingDashboard() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  
  const canManageOnboarding = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'manager';

  // If user is a regular employee, show their personal onboarding
  if (user?.role === 'user') {
    return (
      <div className="space-y-6">
        <MyOnboarding />
      </div>
    );
  }

  // Management view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Onboarding Management</h2>
          <p className="text-muted-foreground">Manage templates, instances, and track new employee progress</p>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="instances">Active Instances</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OnboardingOverview />
        </TabsContent>

        <TabsContent value="instances">
          <OnboardingInstanceManager />
        </TabsContent>

        <TabsContent value="templates">
          <OnboardingTemplateManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OnboardingOverview() {
  // Mock data - in a real app, this would come from your data hooks
  const stats = {
    activeInstances: 5,
    completedThisMonth: 12,
    averageCompletionDays: 14,
    templatesCount: 3
  };

  const recentInstances = [
    {
      id: 1,
      employeeName: 'Sarah Johnson',
      templateName: 'Software Engineer Onboarding',
      startDate: '2024-01-15',
      progress: 75,
      status: 'active'
    },
    {
      id: 2,
      employeeName: 'Mike Chen',
      templateName: 'Marketing Specialist Onboarding',
      startDate: '2024-01-10',
      progress: 100,
      status: 'completed'
    },
    {
      id: 3,
      employeeName: 'Emma Davis',
      templateName: 'Designer Onboarding',
      startDate: '2024-01-08',
      progress: 45,
      status: 'active'
    },
  ];

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Instances</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeInstances}</div>
            <p className="text-xs text-muted-foreground">Currently onboarding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedThisMonth}</div>
            <p className="text-xs text-muted-foreground">Successful onboardings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageCompletionDays}d</div>
            <p className="text-xs text-muted-foreground">Days to complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.templatesCount}</div>
            <p className="text-xs text-muted-foreground">Active templates</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Instances */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Onboarding Instances</CardTitle>
          <CardDescription>Track progress of new team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentInstances.map((instance) => (
              <div key={instance.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{instance.employeeName}</p>
                  <p className="text-sm text-muted-foreground">{instance.templateName}</p>
                  <p className="text-xs text-muted-foreground">Started {instance.startDate}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{instance.progress}%</p>
                    <Progress value={instance.progress} className="w-24 h-2" />
                  </div>
                  <Badge variant={instance.status === 'completed' ? 'default' : 'secondary'}>
                    {instance.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default OnboardingDashboard;