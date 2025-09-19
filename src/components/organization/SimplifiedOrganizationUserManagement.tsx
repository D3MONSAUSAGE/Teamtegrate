
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Users, AlertTriangle } from 'lucide-react';
import { useOrganizationTeamMembers } from '@/hooks/useOrganizationTeamMembers';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useAuth } from '@/contexts/AuthContext';
import { userManagementService } from '@/services/userManagementService';
import { useDataSync } from '@/hooks/useDataSync';
import PaginatedUserList from './user-management/PaginatedUserList';
import OrganizationUserManagementHeader from './user-management/OrganizationUserManagementHeader';
import OrganizationUserStats from './user-management/OrganizationUserStats';
import CreateUserDialog from './CreateUserDialog';
import UserProfileDialog from './user-management/UserProfileDialog';
import { toast } from '@/components/ui/sonner';
import { UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { devLog } from '@/utils/devLogger';

interface RoleChangeResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

const SimplifiedOrganizationUserManagement = () => {
  const { user: currentUser } = useAuth();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  const isFixingRef = useRef(false);

  // Data sync hook for checking missing users
  const { isChecking, checkMissingUsers } = useDataSync();

  // Get organizations (only for superadmin)
  const { organizations, isLoading: loadingOrgs } = useOrganizations();

  // Get users for the selected organization (or current user's org)
  const { users, isLoading, error, refetch } = useOrganizationTeamMembers();

  // Initialize organization selection for superadmin
  useEffect(() => {
    if (currentUser?.role === 'superadmin' && !selectedOrganizationId && currentUser.organizationId) {
      setSelectedOrganizationId(currentUser.organizationId);
      devLog.userOperation('Initialized organization selection for superadmin', { orgId: currentUser.organizationId });
    }
  }, [currentUser, selectedOrganizationId]);

  // Temporary auto-fix: ensure Josue is demoted from superadmin to admin
  // Runs for superadmins viewing this page; retries until success (per mount), with logging and fallback
  useEffect(() => {
    const josueId = 'e158e6d9-3ba7-4dbb-84b5-1ec0110d3931';

    if (!currentUser || currentUser.role !== 'superadmin') return;

    const josue = users?.find(u => u.id === josueId);
    if (!josue || josue.role !== 'superadmin') return;
    if (isFixingRef.current) return;

    (async () => {
      isFixingRef.current = true;
      try {
        devLog.userOperation('Auto-fix: Demoting Josue via admin-update-role', { josueId });
        const { data, error } = await supabase.functions.invoke('admin-update-role', {
          body: { userId: josueId, newRole: 'admin' as UserRole },
        });

        devLog.debug('Auto-fix primary response (admin-update-role)', { data, error });

        let success = !error && (data as any)?.success;

        if (!success) {
          // Fallback: try the authenticated function with org/permission checks
          devLog.userOperation('Auto-fix fallback: update-user-role', { josueId });
          const { data: fbData, error: fbError } = await supabase.functions.invoke('update-user-role', {
            body: { targetUserId: josueId, newRole: 'admin' as UserRole },
          });
          devLog.debug('Auto-fix fallback response (update-user-role)', { data: fbData, error: fbError });
          success = !fbError && (fbData as any)?.success;

          if (!success) {
            const fbErrMsg = fbError?.message || (fbData as any)?.error || 'Unknown fallback error';
            throw new Error(`Both role update attempts failed: ${fbErrMsg}`);
          }
        }

        toast.success('Fixed: Josue demoted to admin');
        await refetch();
      } catch (e: any) {
        console.error('Auto-fix demotion failed', e);
        toast.error(`Auto-fix failed: ${e?.message || 'Unknown error'}`);
      } finally {
        isFixingRef.current = false;
      }
    })();
  }, [currentUser, users, refetch]);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('User list refreshed');
      logger.userAction('User list refreshed');
    } catch (error) {
      logger.error('Failed to refresh user list', error);
      toast.error('Failed to refresh user list');
    }
  };

  const handleDataSyncCheck = async () => {
    logger.userAction('Data sync check initiated');
    await checkMissingUsers();
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUserId(userId);
    
    try {
      devLog.userOperation('Role change initiated', { userId, newRole });

      await userManagementService.changeUserRole(userId, newRole);
      
      logger.userAction('Role update successful', { userId, newRole });
      await refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update role';
      logger.error('Error updating role', { userId, newRole, error: errorMessage });
      toast.error(errorMessage);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleEditUser = (user: any) => {
    devLog.userOperation('Edit user requested', { userId: user.id });
    toast.info('Edit user functionality coming soon');
  };

  const handleDeleteUser = (user: any) => {
    devLog.userOperation('Delete user requested', { userId: user.id });
    toast.info('Delete user functionality coming soon');
  };

  const handleViewProfile = (userId: string) => {
    logger.userAction('View user profile', { userId });
    setSelectedUserId(userId);
    setIsProfileDialogOpen(true);
  };

  const handleUserCreated = async () => {
    logger.userAction('User created successfully');
    await refetch();
    toast.success('User created successfully');
  };

  const handleOrganizationChange = (orgId: string) => {
    logger.userAction('Organization changed', { orgId });
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
