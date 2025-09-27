import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RetrainingSettings from '@/components/training/RetrainingSettings';
import { TrainingBreadcrumb } from '@/components/training/navigation/TrainingBreadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, AlertCircle, Settings } from 'lucide-react';
import TrainingErrorBoundary from '@/components/training/TrainingErrorBoundary';

export function RetrainingPage() {
  const { user } = useAuth();
  const [isRetrainingSettingsOpen, setIsRetrainingSettingsOpen] = useState(false);

  const canManageContent = user && ['superadmin', 'admin', 'manager'].includes(user.role);

  if (!canManageContent) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Access Restricted</h2>
            <p className="text-muted-foreground">You don't have permission to manage retraining settings.</p>
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
              { label: 'Management', href: '/dashboard/training/management' },
              { label: 'Retraining', href: '/dashboard/training/management/retraining' }
            ]} 
          />

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Retraining Management</h1>
            <p className="text-muted-foreground">
              Configure automatic retraining schedules and manage recurring training requirements.
            </p>
          </div>

          {/* Retraining Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Automated retraining schedules
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Retraining due within 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Overdue retraining assignments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Active notification rules
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Retraining Settings Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5" />
                <span>Retraining Configuration</span>
              </CardTitle>
              <CardDescription>
                Set up automatic retraining schedules and notification rules for your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Button 
                  onClick={() => setIsRetrainingSettingsOpen(true)}
                  className="gap-2"
                  size="lg"
                >
                  <Settings className="h-4 w-4" />
                  Configure Retraining Settings
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Set up recurring training schedules and automated reminders
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Schedule Templates</CardTitle>
                <CardDescription>Predefined retraining schedules</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" disabled className="w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Compliance Reports</CardTitle>
                <CardDescription>Retraining compliance tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" disabled className="w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notification History</CardTitle>
                <CardDescription>View sent retraining reminders</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" disabled className="w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Retraining Settings Dialog */}
        <RetrainingSettings 
          open={isRetrainingSettingsOpen}
          onOpenChange={setIsRetrainingSettingsOpen}
        />
      </div>
    </TrainingErrorBoundary>
  );
}