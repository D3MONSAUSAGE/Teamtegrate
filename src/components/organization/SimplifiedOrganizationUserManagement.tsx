
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Users, AlertTriangle } from 'lucide-react';
import { useOrganizationTeamMembers } from '@/hooks/useOrganizationTeamMembers';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useAuth } from '@/contexts/AuthContext';
import { useDataSync } from '@/hooks/useDataSync';
import PaginatedUserList from './user-management/PaginatedUserList';
import OrganizationUserManagementHeader from './user-management/OrganizationUserManagementHeader';
import OrganizationUserStats from './user-management/OrganizationUserStats';
import CreateUserDialog from './CreateUserDialog';
import UserProfileDialog from './user-management/UserProfileDialog';
import { toast } from '@/components/ui/sonner';
import { UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const SimplifiedOrganizationUserManagement = () => {
  const { user: currentUser } = useAuth();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  // Data sync hook for checking missing users
  const { isChecking, checkMissingUsers } = useDataSync();

  // Get organizations (only for superadmin)
  const { organizations, isLoading: loadingOrgs } = useOrganizations();

  // Get users for the selected organization (or current user's org)
  const targetOrgId = selectedOrganizationId || currentUser?.organizationId;
  const { users, isLoading, error, refetch } = useOrganizationTeamMembers();

  // Initialize organization selection for superadmin
  useEffect(() => {
    if (currentUser?.role === 'superadmin' && !selectedOrganizationId && currentUser.organizationId) {
      setSelectedOrganizationId(currentUser.organizationId);
    }
  }, [currentUser, selectedOrganizationId]);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('User list refreshed');
    } catch (error) {
      toast.error('Failed to refresh user list');
    }
  };

  const handleDataSyncCheck = async () => {
    await checkMissingUsers();
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUserId(userId);
    try {
      console.log('Calling update-user-role function with:', {
        targetUserId: userId,
        newRole: newRole
      });

      const { data, error } = await supabase.functions.invoke('update-user-role', {
        body: {
          targetUserId: userId,
          newRole: newRole
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        
        let userMessage = 'Failed to update role';
        if (error.message?.includes('Failed to fetch')) {
          userMessage = 'Connection error. Please check your internet connection and try again.';
        } else if (error.message?.includes('Unauthorized')) {
          userMessage = 'You do not have permission to change this user\'s role.';
        } else if (error.message?.includes('not found')) {
          userMessage = 'User not found. They may have been deleted.';
        } else if (error.message) {
          userMessage = error.message;
        }
        
        throw new Error(userMessage);
      }

      if (data?.error) {
        console.error('Edge function returned error:', data.error);
        throw new Error(data.error);
      }

      if (!data?.success) {
        console.error('Edge function did not return success');
        throw new Error('Role update failed - please try again');
      }

      console.log('Role update successful:', data);
      toast.success(data?.message || `Role updated to ${newRole} successfully`);
      await refetch();
    } catch (error) {
      console.error('Error updating role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update role';
      toast.error(errorMessage);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleEditUser = (user: any) => {
    // Edit user logic would go here
    console.log('Edit user:', user);
    toast.info('Edit user functionality coming soon');
  };

  const handleDeleteUser = (user: any) => {
    // Delete user logic would go here
    console.log('Delete user:', user);
    toast.info('Delete user functionality coming soon');
  };

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
    setIsProfileDialogOpen(true);
  };

  const handleUserCreated = async () => {
    await refetch();
    toast.success('User created successfully');
  };

  const handleOrganizationChange = (orgId: string) => {
    setSelectedOrganizationId(orgId);
  };

  if (isLoading && !users.length) {
    return (
      <Card>
        <OrganizationUserManagementHeader
          userCount={0}
          currentUserRole={currentUser?.role}
          isLoading={isLoading}
          isChecking={isChecking}
          onRefresh={handleRefresh}
          onDataSyncCheck={handleDataSyncCheck}
          onCreateUser={() => setIsCreateUserOpen(true)}
        />
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading team members...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <OrganizationUserManagementHeader
          userCount={0}
          currentUserRole={currentUser?.role}
          isLoading={isLoading}
          isChecking={isChecking}
          onRefresh={handleRefresh}
          onDataSyncCheck={handleDataSyncCheck}
          onCreateUser={() => setIsCreateUserOpen(true)}
        />
        <CardContent>
          <div className="text-center py-8">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to load team members: {error}
                <div className="mt-4">
                  <Button onClick={handleRefresh} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <OrganizationUserManagementHeader
          userCount={users.length}
          currentUserRole={currentUser?.role}
          isLoading={isLoading}
          isChecking={isChecking}
          onRefresh={handleRefresh}
          onDataSyncCheck={handleDataSyncCheck}
          onCreateUser={() => setIsCreateUserOpen(true)}
        />
        
        <CardContent className="space-y-4">
          <OrganizationUserStats
            currentUserRole={currentUser?.role}
            organizations={organizations}
            loadingOrgs={loadingOrgs}
            selectedOrganizationId={selectedOrganizationId}
            onOrganizationChange={handleOrganizationChange}
          />

          {/* Paginated User List */}
          <PaginatedUserList
            users={users}
            updatingUserId={updatingUserId}
            onRoleChange={handleRoleChange}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            onViewProfile={handleViewProfile}
          />
        </CardContent>
      </Card>

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
    </>
  );
};

export default SimplifiedOrganizationUserManagement;
