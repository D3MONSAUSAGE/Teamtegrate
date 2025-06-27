
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle, Loader2, Sparkles, Users, BarChart3, Settings } from 'lucide-react';
import OrganizationEnhancedHeader from '@/components/organization/OrganizationEnhancedHeader';
import OrganizationStatsCards from '@/components/organization/OrganizationStatsCards';
import SimplifiedOrganizationUserManagement from '@/components/organization/SimplifiedOrganizationUserManagement';
import RoleDistributionChart from '@/components/organization/RoleDistributionChart';
import OrganizationQuickActions from '@/components/organization/OrganizationQuickActions';
import TeamManagementSection from '@/components/organization/team/TeamManagementSection';
import InviteCodeDialog from '@/components/organization/InviteCodeDialog';
import ModernSectionCard from '@/components/dashboard/ModernSectionCard';

const OrganizationDashboard = () => {
  const { user, loading } = useAuth();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

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
        <div className="animate-fade-in">
          <OrganizationEnhancedHeader 
            onInviteUsers={() => setIsInviteDialogOpen(true)}
          />
        </div>
        
        {/* Page Title with Modern Design */}
        <div className="text-center space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 backdrop-blur-sm">
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
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <ModernSectionCard
            title="Organization Statistics"
            subtitle="Real-time metrics and performance indicators"
            icon={BarChart3}
            gradient="from-blue-500/10 via-purple-500/10 to-indigo-500/10"
            noPadding
          >
            <div className="p-6">
              <OrganizationStatsCards />
            </div>
          </ModernSectionCard>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8">
          {/* User Management Section */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-8 space-y-8 lg:space-y-0">
            <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <ModernSectionCard
                title="User Management"
                subtitle="Manage organization members and their roles"
                icon={Users}
                gradient="from-blue-500/10 via-indigo-500/10 to-purple-500/10"
              >
                <SimplifiedOrganizationUserManagement />
              </ModernSectionCard>
            </div>
            
            <div className="space-y-8">
              <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
                <ModernSectionCard
                  title="Role Distribution"
                  subtitle="Visual breakdown of user roles"
                  icon={BarChart3}
                  gradient="from-green-500/10 via-emerald-500/10 to-teal-500/10"
                >
                  <RoleDistributionChart />
                </ModernSectionCard>
              </div>
              
              <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
                <ModernSectionCard
                  title="Quick Actions"
                  subtitle="Shortcuts to common tasks"
                  icon={Settings}
                  gradient="from-orange-500/10 via-red-500/10 to-pink-500/10"
                >
                  <OrganizationQuickActions />
                </ModernSectionCard>
              </div>
            </div>
          </div>

          {/* Team Management Section */}
          <div className="animate-fade-in" style={{ animationDelay: '600ms' }}>
            <ModernSectionCard
              title="Team Management"
              subtitle="Organize and manage your teams"
              icon={Users}
              gradient="from-cyan-500/10 via-sky-500/10 to-blue-500/10"
            >
              <TeamManagementSection />
            </ModernSectionCard>
          </div>
        </div>
      </div>

      {/* Invite Code Dialog */}
      <InviteCodeDialog 
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
      />
    </div>
  );
};

export default OrganizationDashboard;
