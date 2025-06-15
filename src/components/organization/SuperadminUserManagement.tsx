
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Crown, Loader2, Shield, AlertTriangle } from 'lucide-react';
import { useSuperadminUserManagement } from '@/hooks/organization/useSuperadminUserManagement';
import UserManagementFilters from './user-management/UserManagementFilters';
import UserList from './user-management/UserList';
import CreateUserDialog from './CreateUserDialog';
import EditUserDialog from './EditUserDialog';
import SimpleDeleteUserDialog from './SimpleDeleteUserDialog';
import SuperadminTransferDialog from './SuperadminTransferDialog';
import ConnectionStatusIndicator from './ConnectionStatusIndicator';

const SuperadminUserManagement: React.FC = () => {
  const {
    users,
    filteredUsers,
    isLoading,
    error,
    isSuperadmin,
    isUsingFallback,
    connectionStatus,
    testConnection,
    searchTerm,
    setSearchTerm,
    selectedRole,
    setSelectedRole,
    updatingUserId,
    isTransferring,
    createDialogOpen,
    setCreateDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    transferDialogOpen,
    setTransferDialogOpen,
    selectedUser,
    transferData,
    handleQuickRoleChange,
    handleSuperadminTransfer,
    handleEditUser,
    handleDeleteUser,
    onUserDeleted,
    onUserUpdated,
    onUserCreated
  } = useSuperadminUserManagement();

  if (!isSuperadmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Only superadmins can access user management.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {isUsingFallback && (
                <div className="mt-2 text-sm">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                    Using fallback data source
                  </Badge>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const currentSuperadmin = users.find(user => user.role === 'superadmin');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
            <Badge variant="outline" className="ml-auto">
              {filteredUsers.length} Users
            </Badge>
          </CardTitle>
          <div className="flex items-center justify-between">
            {currentSuperadmin && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span>Current Superadmin: <strong>{currentSuperadmin.name}</strong></span>
              </div>
            )}
            <ConnectionStatusIndicator
              status={connectionStatus}
              onTest={testConnection}
              isLoading={isLoading}
            />
          </div>
          {isUsingFallback && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Using fallback data source. Some features may be limited.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <UserManagementFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedRole={selectedRole}
              setSelectedRole={setSelectedRole}
              onCreateUser={() => setCreateDialogOpen(true)}
            />

            <UserList
              users={filteredUsers}
              updatingUserId={updatingUserId}
              onRoleChange={handleQuickRoleChange}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onUserCreated={onUserCreated}
      />

      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        onUserUpdated={onUserUpdated}
      />

      <SimpleDeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={selectedUser}
        onUserDeleted={onUserDeleted}
      />

      <SuperadminTransferDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        transferData={transferData}
        onConfirm={handleSuperadminTransfer}
        isTransferring={isTransferring}
      />
    </>
  );
};

export default SuperadminUserManagement;
