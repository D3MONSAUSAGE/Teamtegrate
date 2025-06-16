
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Crown, Loader2, Shield, AlertTriangle } from 'lucide-react';
import UserManagementFilters from './user-management/UserManagementFilters';
import UserList from './user-management/UserList';
import CreateUserDialog from './CreateUserDialog';
import EditUserDialog from './EditUserDialog';
import SimpleDeleteUserDialog from './SimpleDeleteUserDialog';

const SimplifiedOrganizationUserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const fetchUsers = useCallback(async () => {
    if (!currentUser?.organizationId) return;

    try {
      setIsLoading(true);
      
      // Use the same direct query pattern as AdminUserManagement
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', currentUser.id);

      if (error) throw error;
      
      // Convert database format to User type
      const formattedUsers: User[] = (data || []).map(dbUser => ({
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role as UserRole,
        organizationId: dbUser.organization_id,
        timezone: dbUser.timezone || 'UTC',
        avatar_url: dbUser.avatar_url,
        createdAt: new Date(dbUser.created_at)
      }));
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.organizationId, currentUser?.id]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleQuickRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast.success('User role updated successfully');
      await fetchUsers(); // Refresh the list
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
    fetchUsers();
    toast.success('User created successfully');
  };

  const onUserUpdated = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
    fetchUsers();
    toast.success('User updated successfully');
  };

  const onUserDeleted = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
    fetchUsers();
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
          </CardTitle>
          <div className="flex items-center justify-between">
            {currentSuperadmin && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span>Current Superadmin: <strong>{currentSuperadmin.name}</strong></span>
              </div>
            )}
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
