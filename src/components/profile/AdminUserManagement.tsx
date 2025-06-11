
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import UserManagementHeader from './UserManagementHeader';
import UserManagementTable from './UserManagementTable';
import EnhancedUserDeleteDialog from './EnhancedUserDeleteDialog';
import EditUserDialog from './EditUserDialog';

const AdminUserManagement = () => {
  const { users, isLoading, refetchUsers } = useUsers();
  const { user: currentUser } = useAuth();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Only show for superadmin
  if (!currentUser || currentUser.role !== 'superadmin') {
    return null;
  }

  const handleDeleteUser = async (deletionReason: string) => {
    if (!userToDelete || !currentUser || currentUser.role !== 'superadmin') {
      toast.error("Unauthorized to perform this action");
      return;
    }

    if (userToDelete.id === currentUser.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    // Additional organization check - ensure both users are in the same organization
    if (userToDelete.organization_id !== currentUser.organization_id) {
      toast.error("You can only delete users within your organization");
      return;
    }

    setDeletingUser(userToDelete.id);
    try {
      console.log('Calling delete-user function with:', { 
        targetUserId: userToDelete.id,
        deletionReason 
      });

      // Call the edge function to delete the user
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: {
          targetUserId: userToDelete.id,
          deletionReason
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to delete user');
      }

      if (data?.error) {
        console.error('Edge function returned error:', data.error);
        throw new Error(data.error);
      }

      console.log('User deletion successful:', data);
      toast.success(data?.message || 'User deleted successfully');
      
      // Show impact summary if available
      if (data?.impactSummary) {
        const impact = data.impactSummary;
        console.log('Deletion impact:', impact);
        
        if (impact.tasks_assigned > 0 || impact.projects_managed > 0) {
          toast.info(`Cleanup completed: ${impact.tasks_assigned} tasks unassigned, ${impact.projects_managed} projects affected`);
        }
      }
      
      refetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      toast.error(errorMessage);
    } finally {
      setDeletingUser(null);
      setUserToDelete(null);
    }
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };

  const canDeleteUser = (targetUser: any) => {
    if (targetUser.id === currentUser?.id) return false;
    // Additional organization check
    if (targetUser.organization_id !== currentUser?.organization_id) return false;
    return currentUser?.role === 'superadmin';
  };

  // Filter users based on search query (users are already filtered by organization via RLS)
  const filteredUsers = users.filter(user => 
    (user.name || user.email).toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <UserManagementHeader userCount={0} />
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading users from your organization...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <UserManagementHeader userCount={filteredUsers.length} />
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users in your organization by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <UserManagementTable
            users={filteredUsers}
            currentUserId={currentUser?.id}
            currentUserRole={currentUser?.role}
            canDeleteUser={canDeleteUser}
            deletingUser={deletingUser}
            onDeleteClick={handleDeleteClick}
            onEditClick={handleEditUser}
            onRoleChanged={refetchUsers}
          />
        </CardContent>
      </Card>

      <EnhancedUserDeleteDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        user={userToDelete}
        isDeleting={!!deletingUser}
      />

      {userToEdit && (
        <EditUserDialog
          isOpen={!!userToEdit}
          onClose={() => setUserToEdit(null)}
          onUserUpdated={refetchUsers}
          user={userToEdit}
        />
      )}
    </>
  );
};

export default AdminUserManagement;
