
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, Loader2, Shield } from 'lucide-react';
import { useSuperadminUserManagement } from '@/hooks/organization/useSuperadminUserManagement';
import UserManagementFilters from './user-management/UserManagementFilters';
import UserList from './user-management/UserList';
import CreateUserDialog from './CreateUserDialog';
import EditUserDialog from './EditUserDialog';
import SimpleDeleteUserDialog from './SimpleDeleteUserDialog';
import SuperadminTransferDialog from './SuperadminTransferDialog';

const SuperadminUserManagement: React.FC = () => {
  const {
    users,
    filteredUsers,
    isLoading,
    error,
    isSuperadmin,
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
          <p className="text-destructive text-center py-4">{error}</p>
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
          {currentSuperadmin && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span>Current Superadmin: <strong>{currentSuperadmin.name}</strong></span>
            </div>
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
