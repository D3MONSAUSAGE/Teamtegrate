import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CertificateReviewDashboard from '@/components/training/CertificateReviewDashboard';
import { TrainingBreadcrumb } from '@/components/training/navigation/TrainingBreadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, FileCheck, Clock, Users } from 'lucide-react';
import TrainingErrorBoundary from '@/components/training/TrainingErrorBoundary';

export function CertificatesPage() {
  const { user } = useAuth();
  const [isCertificateReviewOpen, setIsCertificateReviewOpen] = useState(false);

  const canManageContent = user && ['superadmin', 'admin', 'manager'].includes(user.role);

  if (!canManageContent) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Access Restricted</h2>
            <p className="text-muted-foreground">You don't have permission to manage certificates.</p>
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
              { label: 'Certificates', href: '/dashboard/training/management/certificates' }
            ]} 
          />

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Certificate Management</h1>
            <p className="text-muted-foreground">
              Review, approve, and manage training certificates and completion records.
            </p>
          </div>

          {/* Certificate Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Certificates awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Certificates approved this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  All time certificate count
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Certified Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Employees with active certificates
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Certificate Management Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Certificate Review Dashboard</span>
              </CardTitle>
              <CardDescription>
                Review and approve training completion certificates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Button 
                  onClick={() => setIsCertificateReviewOpen(true)}
                  className="gap-2"
                  size="lg"
                >
                  <Award className="h-4 w-4" />
                  Open Certificate Dashboard
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Review pending certificates and manage approval workflow
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Certificate Templates</CardTitle>
                <CardDescription>Manage certificate designs</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" disabled className="w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bulk Operations</CardTitle>
                <CardDescription>Batch approve certificates</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" disabled className="w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Certificate Reports</CardTitle>
                <CardDescription>Generate certificate reports</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" disabled className="w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Certificate Review Dashboard Dialog */}
        <CertificateReviewDashboard 
          open={isCertificateReviewOpen}
          onOpenChange={setIsCertificateReviewOpen}
        />
      </div>
    </TrainingErrorBoundary>
  );
}