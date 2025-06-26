
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import OrganizationHeader from '@/components/organization/OrganizationHeader';
import OrganizationStatsCards from '@/components/organization/OrganizationStatsCards';
import SimplifiedOrganizationUserManagement from '@/components/organization/SimplifiedOrganizationUserManagement';
import RoleDistributionChart from '@/components/organization/RoleDistributionChart';
import OrganizationQuickActions from '@/components/organization/OrganizationQuickActions';
import TeamManagementSection from '@/components/organization/team/TeamManagementSection';

const OrganizationDashboard = () => {
  const { user, loading } = useAuth();

  // Show loading state while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-primary" />
              <div className="absolute inset-0 h-16 w-16 mx-auto rounded-full bg-primary/20 animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Loading Organization</h3>
            <p className="text-muted-foreground">Please wait while we load your organization dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if user exists
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="p-6 flex items-center justify-center min-h-screen">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to access the organization page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Check if user has permission to access organization page
  const hasOrganizationAccess = ['superadmin', 'admin', 'manager'].includes(user.role);
  
  if (!hasOrganizationAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="p-6 flex items-center justify-center min-h-screen">
          <Alert className="max-w-2xl border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              You don't have permission to access the organization page. 
              Contact your administrator for access. Your current role is: <strong>{user.role}</strong>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="p-3 sm:p-6 space-y-8 max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-3xl blur-xl opacity-50" />
          <div className="relative">
            <OrganizationHeader />
          </div>
        </div>
        
        {/* Page Title with Modern Design */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
                Organization Dashboard
              </h1>
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your organization, users, teams, and monitor performance metrics
          </p>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 via-blue-100/50 to-indigo-100/50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-2xl blur-xl" />
          <div className="relative">
            <OrganizationStatsCards />
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8">
          {/* User Management Section */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-8 space-y-8 lg:space-y-0">
            <div className="lg:col-span-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-indigo-100/50 to-purple-100/50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl blur-xl" />
                <div className="relative">
                  <SimplifiedOrganizationUserManagement />
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-100/50 via-emerald-100/50 to-teal-100/50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl blur-xl" />
                <div className="relative">
                  <RoleDistributionChart />
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-100/50 via-red-100/50 to-pink-100/50 dark:from-orange-900/20 dark:via-red-900/20 dark:to-pink-900/20 rounded-2xl blur-xl" />
                <div className="relative">
                  <OrganizationQuickActions />
                </div>
              </div>
            </div>
          </div>

          {/* Team Management Section */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/50 via-sky-100/50 to-blue-100/50 dark:from-cyan-900/20 dark:via-sky-900/20 dark:to-blue-900/20 rounded-2xl blur-xl" />
            <div className="relative">
              <TeamManagementSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationDashboard;
