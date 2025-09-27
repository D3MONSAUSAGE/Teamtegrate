import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import EmployeeProgressDashboard from '@/components/training/EmployeeProgressDashboard';
import { TrainingBreadcrumb } from '@/components/training/navigation/TrainingBreadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, TrendingUp, Award } from 'lucide-react';
import TrainingErrorBoundary from '@/components/training/TrainingErrorBoundary';

export function TrainingAnalyticsPage() {
  const { user } = useAuth();
  const [isEmployeeProgressOpen, setIsEmployeeProgressOpen] = useState(false);

  const canManageContent = user && ['superadmin', 'admin', 'manager'].includes(user.role);

  if (!canManageContent) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Access Restricted</h2>
            <p className="text-muted-foreground">You don't have permission to view training analytics.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TrainingErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <TrainingBreadcrumb 
            items={[
              { label: 'Training', href: '/dashboard/training' },
              { label: 'Analytics', href: '/dashboard/training/analytics' }
            ]} 
          />

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Training Analytics</h1>
            <p className="text-muted-foreground">
              Monitor employee training progress, completion rates, and performance metrics.
            </p>
          </div>

          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Employee Progress</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Track Progress</div>
                <p className="text-xs text-muted-foreground">
                  Individual employee training progress
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEmployeeProgressOpen(true)}
                  className="mt-3 w-full"
                >
                  View Details
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rates</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
                <p className="text-xs text-muted-foreground">
                  Organization-wide completion metrics
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Reports</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
                <p className="text-xs text-muted-foreground">
                  Detailed performance analytics
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Certifications</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
                <p className="text-xs text-muted-foreground">
                  Certification tracking and status
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Analytics Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Training Analytics Dashboard</span>
              </CardTitle>
              <CardDescription>
                Comprehensive training metrics and employee progress tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Button 
                  onClick={() => setIsEmployeeProgressOpen(true)}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Open Employee Progress Dashboard
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  View detailed progress reports for all employees
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Progress Dashboard Dialog */}
        <EmployeeProgressDashboard
          open={isEmployeeProgressOpen}
          onOpenChange={setIsEmployeeProgressOpen}
        />
      </div>
    </TrainingErrorBoundary>
  );
}