
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationTeamMembers } from '@/hooks/useOrganizationTeamMembers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Crown, Loader2, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import UserManagementFilters from './user-management/UserManagementFilters';
import UserList from './user-management/UserList';
import CreateUserDialog from './CreateUserDialog';
import EditUserDialog from './EditUserDialog';
import SimpleDeleteUserDialog from './SimpleDeleteUserDialog';

const SimplifiedOrganizationUserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { users, isLoading, refetch } = useOrganizationTeamMembers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const handleQuickRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast.success('User role updated successfully');
      await refetch(); // Refresh the list
    } catch (error) {
      console.error('Role change failed:', error);
      toast.error('Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const onUserCreated = () => {
    setCreateDialogOpen(false);
    refetch();
    toast.success('User created successfully');
  };

  const onUserUpdated = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
    refetch();
    toast.success('User updated successfully');
  };

  const onUserDeleted = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
    refetch();
    toast.success('User deleted successfully');
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const isSuperadmin = currentUser?.role === 'superadmin';

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
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
          <div className="flex items-center justify-between">
            {currentSuperadmin && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span>Current Superadmin: <strong>{currentSuperadmin.name}</strong></span>
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Organization: {currentUser?.organizationId} | Total Users Found: {users.length}
          </div>
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
    </>
  );
};

export default SimplifiedOrganizationUserManagement;
