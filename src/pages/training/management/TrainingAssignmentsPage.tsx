import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserAssignment from '@/components/training/UserAssignment';
import { TrainingBreadcrumb } from '@/components/training/navigation/TrainingBreadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Settings } from 'lucide-react';
import TrainingErrorBoundary from '@/components/training/TrainingErrorBoundary';

export function TrainingAssignmentsPage() {
  const { user } = useAuth();
  const [isUserAssignmentOpen, setIsUserAssignmentOpen] = useState(false);

  const canManageContent = user && ['superadmin', 'admin', 'manager'].includes(user.role);

  if (!canManageContent) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Access Restricted</h2>
            <p className="text-muted-foreground">You don't have permission to manage training assignments.</p>
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
              { label: 'Assignments', href: '/dashboard/training/management/assignments' }
            ]} 
          />

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Training Assignment Management</h1>
            <p className="text-muted-foreground">
              Assign training courses and quizzes to employees and teams.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-md bg-blue-500 text-white">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">New Assignment</CardTitle>
                    <CardDescription>Assign training to employees</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setIsUserAssignmentOpen(true)}
                  className="w-full"
                >
                  Create Assignment
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-md bg-green-500 text-white">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Bulk Assignments</CardTitle>
                    <CardDescription>Coming soon</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" disabled className="w-full">
                  Assign to Teams
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-md bg-purple-500 text-white">
                    <Settings className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Auto Assignments</CardTitle>
                    <CardDescription>Coming soon</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" disabled className="w-full">
                  Configure Rules
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Assignment Management Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Assignment Management</span>
              </CardTitle>
              <CardDescription>
                Create and manage training assignments for your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Button 
                  onClick={() => setIsUserAssignmentOpen(true)}
                  className="gap-2"
                  size="lg"
                >
                  <Plus className="h-4 w-4" />
                  Create New Assignment
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Assign courses and quizzes to individual employees or teams
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Assignment Dialog */}
        <UserAssignment 
          open={isUserAssignmentOpen}
          onOpenChange={setIsUserAssignmentOpen}
        />
      </div>
    </TrainingErrorBoundary>
  );
}