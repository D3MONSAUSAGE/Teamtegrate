import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import EmployeeProgressDashboard from '@/components/training/EmployeeProgressDashboard';
import { TrainingBreadcrumb } from '@/components/training/navigation/TrainingBreadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, Download, Search } from 'lucide-react';
import TrainingErrorBoundary from '@/components/training/TrainingErrorBoundary';

export function EmployeeRecordsPage() {
  const { user } = useAuth();
  const [isEmployeeProgressOpen, setIsEmployeeProgressOpen] = useState(false);

  const canManageContent = user && ['superadmin', 'admin', 'manager'].includes(user.role);

  if (!canManageContent) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Access Restricted</h2>
            <p className="text-muted-foreground">You don't have permission to view employee records.</p>
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
              { label: 'Employee Records', href: '/dashboard/training/management/employee-records' }
            ]} 
          />

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Employee Training Records</h1>
            <p className="text-muted-foreground">
              View and manage employee training progress, completion records, and certifications.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-md bg-blue-500 text-white">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Progress Dashboard</CardTitle>
                    <CardDescription className="text-sm">View employee progress</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  onClick={() => setIsEmployeeProgressOpen(true)}
                  size="sm"
                  className="w-full"
                >
                  Open Dashboard
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-md bg-green-500 text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Training Reports</CardTitle>
                    <CardDescription className="text-sm">Coming soon</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" disabled className="w-full">
                  Generate Reports
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-md bg-purple-500 text-white">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Export Data</CardTitle>
                    <CardDescription className="text-sm">Coming soon</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" disabled className="w-full">
                  Export CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-md bg-orange-500 text-white">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Search Records</CardTitle>
                    <CardDescription className="text-sm">Coming soon</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" disabled className="w-full">
                  Search
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Employee Records Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Employee Training Records</span>
              </CardTitle>
              <CardDescription>
                Comprehensive view of employee training progress and completion records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Button 
                  onClick={() => setIsEmployeeProgressOpen(true)}
                  className="gap-2"
                  size="lg"
                >
                  <Users className="h-4 w-4" />
                  View Employee Progress Dashboard
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Access detailed training records and progress tracking for all employees
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