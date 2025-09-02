import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Download,
  Eye,
  UserCheck
} from 'lucide-react';
import { useOnboardingDashboard } from '@/hooks/onboarding/useOnboardingDocuments';
import { format } from 'date-fns';
// Removed import - using direct role check
import { OnboardingSubmissionsList } from './OnboardingSubmissionsList';
import { OnboardingComplianceTracker } from './OnboardingComplianceTracker';
import { DocumentRequirementsManager } from './DocumentRequirementsManager';

export function OnboardingAdminDashboard() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading } = useOnboardingDashboard();
  const [activeTab, setActiveTab] = useState('overview');

  // Check permissions
  if (!user || !['manager', 'admin', 'superadmin'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">You don't have permission to access the onboarding admin dashboard.</p>
          <p className="text-sm text-muted-foreground">Manager, Admin, or Super Admin access required.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-2 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const submissionStats = dashboardData?.submission_stats;
  const complianceStats = dashboardData?.compliance_stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Onboarding Administration</h1>
          <p className="text-muted-foreground">
            Monitor employee onboarding progress, document submissions, and compliance status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissionStats?.total_submissions || 0}</div>
            <p className="text-xs text-muted-foreground">
              All document submissions across active onboarding processes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {submissionStats?.pending_review || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Documents awaiting manager approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(complianceStats?.completion_rate || 0)}%
            </div>
            <Progress 
              value={complianceStats?.completion_rate || 0} 
              className="h-2 mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(submissionStats?.overdue || 0) + (complianceStats?.overdue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Documents and compliance items past due
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">Document Submissions</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Tracking</TabsTrigger>
          <TabsTrigger value="requirements">Document Requirements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Submissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Recent Submissions
                </CardTitle>
                <CardDescription>
                  Latest document submissions requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recent_submissions?.slice(0, 5).map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{submission.file_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {submission.employee?.name} • {format(new Date(submission.submitted_at), 'MMM d, h:mm a')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            submission.submission_status === 'approved' ? 'default' :
                            submission.submission_status === 'rejected' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {submission.submission_status.replace('_', ' ')}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Pending Approvals
                </CardTitle>
                <CardDescription>
                  Documents awaiting your review and approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.pending_approvals?.slice(0, 5).map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{submission.requirement?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {submission.employee?.name} • {format(new Date(submission.submitted_at), 'MMM d, h:mm a')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Pending Review</Badge>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!dashboardData?.pending_approvals || dashboardData.pending_approvals.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                      <p>No pending approvals</p>
                      <p className="text-sm">All submissions have been reviewed</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overdue Items */}
          {dashboardData?.overdue_items && dashboardData.overdue_items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Overdue Items Requiring Attention
                </CardTitle>
                <CardDescription>
                  Documents and compliance items that are past their due dates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.overdue_items.slice(0, 10).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex-1">
                        <div className="font-medium text-red-800">
                          {'file_name' in item ? item.file_name : `${item.compliance_type} Compliance`}
                        </div>
                        <div className="text-sm text-red-600">
                          {'employee' in item ? item.employee?.name : 'compliance_type' in item ? 'Compliance Item' : 'Unknown'} • 
                          Due: {'due_date' in item ? format(new Date(item.due_date!), 'MMM d, yyyy') : 'Unknown'}
                        </div>
                      </div>
                      <Badge variant="destructive">Overdue</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="submissions">
          <OnboardingSubmissionsList />
        </TabsContent>

        <TabsContent value="compliance">
          <OnboardingComplianceTracker />
        </TabsContent>

        <TabsContent value="requirements">
          <DocumentRequirementsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default OnboardingAdminDashboard;