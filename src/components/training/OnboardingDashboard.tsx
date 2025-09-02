import { useState } from 'react';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, CheckCircle, Clock, Users, FileText, Calendar, Settings, MessageSquare, BarChart3, Library, FileCheck, AlertTriangle } from 'lucide-react';
import { OnboardingTemplateManager } from '@/components/onboarding/OnboardingTemplateManager';
import { OnboardingInstanceManager } from '@/components/onboarding/OnboardingInstanceManager';
import { MyOnboarding } from '@/components/onboarding/MyOnboarding';
import { MyFeedbackCheckpoints } from '@/components/onboarding/MyFeedbackCheckpoints';
import { FeedbackDashboard } from '@/components/onboarding/FeedbackDashboard';
import { OnboardingAnalyticsDashboard } from '@/components/onboarding/analytics/OnboardingAnalyticsDashboard';
import { ResourceManager } from '@/components/onboarding/resources/ResourceManager';
import { EmployeeDocumentPortal } from '@/components/onboarding/employee/EmployeeDocumentPortal';
import { OnboardingAdminDashboard } from '@/components/onboarding/admin/OnboardingAdminDashboard';
import { useMyOnboarding } from '@/hooks/onboarding/useOnboardingInstances';
import { useMyPendingFeedback } from '@/hooks/onboarding/useOnboardingFeedback';
import { useOnboardingDashboard } from '@/hooks/onboarding/useOnboardingDocuments';

export function OnboardingDashboard() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const { data: myOnboarding } = useMyOnboarding();
  const { data: pendingFeedback } = useMyPendingFeedback();
  
  const canManageOnboarding = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'manager';
  const hasActiveOnboarding = myOnboarding?.status === 'active';
  const pendingFeedbackCount = pendingFeedback?.length || 0;

  // If user is a regular employee, show their personal onboarding and feedback
  if (user?.role === 'user') {
    return (
      <div className="space-y-6">
        <Tabs defaultValue={hasActiveOnboarding ? "onboarding" : pendingFeedbackCount > 0 ? "feedback" : "onboarding"}>
          <TabsList>
            <TabsTrigger value="onboarding" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              My Onboarding
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Documents
            </TabsTrigger>
            {pendingFeedbackCount > 0 && (
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Feedback
                <Badge variant="destructive" className="ml-1 h-5 text-xs">
                  {pendingFeedbackCount}
                </Badge>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="onboarding">
            <MyOnboarding />
          </TabsContent>

          <TabsContent value="documents">
            <EmployeeDocumentPortal />
          </TabsContent>

          {pendingFeedbackCount > 0 && (
            <TabsContent value="feedback">
              <MyFeedbackCheckpoints />
            </TabsContent>
          )}
        </Tabs>
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
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
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

        <TabsContent value="documents">
          <OnboardingAdminDashboard />
        </TabsContent>

        <TabsContent value="resources">
          <ResourceManager />
        </TabsContent>

        <TabsContent value="feedback">
          <FeedbackDashboard />
        </TabsContent>

        <TabsContent value="analytics">
          <OnboardingAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OnboardingOverview() {
  const { data: dashboardData, isLoading } = useOnboardingDashboard();

  // Mock data for onboarding instances (to be replaced with real data)
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.submission_stats?.pending_review || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{dashboardData?.submission_stats?.overdue || 0}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
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