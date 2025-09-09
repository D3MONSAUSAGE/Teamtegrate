
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TeamProvider } from '@/components/team/TeamProvider';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertCircle, Loader2, BarChart3, Users, Settings, Activity, Briefcase } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import ProfessionalOrganizationHeader from '@/components/organization/professional/ProfessionalOrganizationHeader';
import SuperadminUserManagement from '@/components/organization/SuperadminUserManagement';
import OrganizationStatsCards from '@/components/organization/OrganizationStatsCards';
import RoleDistributionChart from '@/components/organization/RoleDistributionChart';
import OrganizationQuickActions from '@/components/organization/OrganizationQuickActions';
import TeamManagementSection from '@/components/organization/team/TeamManagementSection';
import InviteCodeDialog from '@/components/organization/InviteCodeDialog';
import { RoleManager } from '@/components/organization/RoleManager';
import UserProfileDialog from '@/components/organization/user-management/UserProfileDialog';
import CreateUserDialog from '@/components/organization/CreateUserDialog';
import ModernSectionCard from '@/components/dashboard/ModernSectionCard';
import AccessControlManager from '@/components/organization/access-control/AccessControlManager';
import { devLog } from '@/utils/devLogger';
import { logger } from '@/utils/logger';
import RequestTypeManager from '@/components/organization/requests/RequestTypeManager';

interface UserToEdit {
  id: string;
  name: string;
  email: string;
  role: string;
}

const OrganizationDashboard = () => {
  const { user, loading } = useAuth();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  // Show loading state while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
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
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
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
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
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

  const handleViewProfile = (userId: string) => {
    devLog.userOperation('View user profile requested', { userId });
    setSelectedUserId(userId);
    setIsProfileDialogOpen(true);
  };

  const handleEditUser = async (userToEdit: UserToEdit) => {
    devLog.userOperation('Edit user requested', { userId: userToEdit.id });
    
    try {
      // For now, we'll implement a simple name update
      const newName = prompt(`Edit name for ${userToEdit.name}:`, userToEdit.name);
      
      if (newName && newName.trim() !== userToEdit.name) {
        const { error } = await supabase
          .from('users')
          .update({ name: newName.trim() })
          .eq('id', userToEdit.id);

        if (error) throw error;

        toast.success('User updated successfully');
        logger.userAction('User edited successfully', { userId: userToEdit.id });
        
        // Force refresh of user data
        window.location.reload();
      }
    } catch (error) {
      logger.error('Error editing user', error);
      toast.error('Failed to edit user');
    }
  };

  const handleDeleteUser = async (userToDelete: UserToEdit) => {
    devLog.userOperation('Delete user requested', { userId: userToDelete.id });
    
    if (!confirm(`Are you sure you want to delete user "${userToDelete.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Call the delete user edge function
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { targetUserId: userToDelete.id }
      });

      if (error) throw error;

      toast.success('User deleted successfully');
      logger.userAction('User deleted successfully', { userId: userToDelete.id });
      
      // Force refresh of user data
      window.location.reload();
    } catch (error) {
      logger.error('Error deleting user', error);
      toast.error('Failed to delete user');
    }
  };

  const handleUserCreated = () => {
    devLog.userOperation('User created successfully');
    logger.userAction('User created from organization dashboard');
  };

  return (
    <TeamProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="p-3 sm:p-6 space-y-8 max-w-7xl mx-auto">
          {/* Professional Header */}
          <div className="animate-fade-in">
            <ProfessionalOrganizationHeader 
              onInviteUsers={() => setIsInviteDialogOpen(true)}
            />
          </div>
          
          {/* Tabbed Interface */}
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-7 lg:w-fit lg:grid-cols-7 bg-muted/60 backdrop-blur-sm border">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Users</span>
                </TabsTrigger>
                <TabsTrigger value="teams" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Teams</span>
                </TabsTrigger>
                <TabsTrigger value="roles" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Job Roles</span>
                </TabsTrigger>
                <TabsTrigger value="access" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Access</span>
                </TabsTrigger>
                <TabsTrigger value="requests" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Requests</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ModernSectionCard
                    title="Quick Actions"
                    subtitle="Shortcuts to common tasks"
                    icon={Shield}
                    gradient="from-orange-500/10 via-red-500/10 to-pink-500/10"
                  >
                    <OrganizationQuickActions />
                  </ModernSectionCard>

                  <ModernSectionCard
                    title="Role Distribution"
                    subtitle="Visual breakdown of user roles"
                    icon={BarChart3}
                    gradient="from-green-500/10 via-emerald-500/10 to-teal-500/10"
                  >
                    <RoleDistributionChart />
                  </ModernSectionCard>
                </div>
              </TabsContent>

              {/* User Management Tab */}
              <TabsContent value="users" className="space-y-6">
                <SuperadminUserManagement />
              </TabsContent>

              {/* Team Management Tab */}
              <TabsContent value="teams" className="space-y-6">
                <TeamManagementSection />
              </TabsContent>

              {/* Job Roles Tab */}
              <TabsContent value="roles" className="space-y-6">
                <ModernSectionCard
                  title="Job Roles Management"
                  subtitle="Create and manage organizational job roles"
                  icon={Briefcase}
                  gradient="from-purple-500/10 via-indigo-500/10 to-blue-500/10"
                >
                  <RoleManager />
                </ModernSectionCard>
              </TabsContent>

              {/* Access Control Tab */}
              <TabsContent value="access" className="space-y-6">
                <ModernSectionCard
                  title="Access Control"
                  subtitle="Manage permissions by role, job role, or individual"
                  icon={Settings}
                  gradient="from-indigo-500/10 via-blue-500/10 to-cyan-500/10"
                >
                  <AccessControlManager />
                </ModernSectionCard>
              </TabsContent>

              {/* Requests Management Tab */}
              <TabsContent value="requests" className="space-y-6">
                <ModernSectionCard
                  title="Request Types"
                  subtitle="Configure which request options exist and who can use them"
                  icon={Shield}
                  gradient="from-blue-500/10 via-purple-500/10 to-indigo-500/10"
                >
                  {/* Request Type Management Component */}
                  <RequestTypeManager />
                </ModernSectionCard>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <ModernSectionCard
                    title="Role Distribution Chart"
                    subtitle="Detailed role analysis"
                    icon={BarChart3}
                    gradient="from-purple-500/10 via-indigo-500/10 to-blue-500/10"
                  >
                    <RoleDistributionChart />
                  </ModernSectionCard>

                  <ModernSectionCard
                    title="Detailed Statistics"
                    subtitle="In-depth organizational metrics"
                    icon={Activity}
                    gradient="from-emerald-500/10 via-teal-500/10 to-cyan-500/10"
                    noPadding
                  >
                    <div className="p-6">
                      <OrganizationStatsCards />
                    </div>
                  </ModernSectionCard>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Dialogs */}
        <InviteCodeDialog 
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
        />

        <CreateUserDialog 
          open={isCreateUserOpen}
          onOpenChange={setIsCreateUserOpen}
          onUserCreated={handleUserCreated}
        />

        <UserProfileDialog
          userId={selectedUserId}
          open={isProfileDialogOpen}
          onOpenChange={setIsProfileDialogOpen}
        />
      </div>
    </TeamProvider>
  );
};

export default OrganizationDashboard;
