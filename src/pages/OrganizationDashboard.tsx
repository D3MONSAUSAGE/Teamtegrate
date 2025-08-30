
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle, Loader2, BarChart3 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import ProfessionalOrganizationHeader from '@/components/organization/professional/ProfessionalOrganizationHeader';
import SuperadminUserManagement from '@/components/organization/SuperadminUserManagement';
import OrganizationStatsCards from '@/components/organization/OrganizationStatsCards';
import RoleDistributionChart from '@/components/organization/RoleDistributionChart';
import OrganizationQuickActions from '@/components/organization/OrganizationQuickActions';
import TeamManagementSection from '@/components/organization/team/TeamManagementSection';
import InviteCodeDialog from '@/components/organization/InviteCodeDialog';
import UserProfileDialog from '@/components/organization/user-management/UserProfileDialog';
import CreateUserDialog from '@/components/organization/CreateUserDialog';
import ModernSectionCard from '@/components/dashboard/ModernSectionCard';
import { devLog } from '@/utils/devLogger';
import { logger } from '@/utils/logger';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="p-3 sm:p-6 space-y-8 max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="animate-fade-in">
          <ProfessionalOrganizationHeader 
            onInviteUsers={() => setIsInviteDialogOpen(true)}
          />
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
          {/* Professional User Management */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-8 space-y-8 lg:space-y-0">
            <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <SuperadminUserManagement />
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
                  icon={Shield}
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
              icon={Shield}
              gradient="from-cyan-500/10 via-sky-500/10 to-blue-500/10"
            >
              <TeamManagementSection />
            </ModernSectionCard>
          </div>
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
  );
};

export default OrganizationDashboard;
