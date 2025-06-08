
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import UserManagementHeader from './UserManagementHeader';
import UserManagementTable from './UserManagementTable';
import UserDeleteDialog from './UserDeleteDialog';

const AdminUserManagement = () => {
  const { users, isLoading, refetchUsers } = useUsers();
  const { user: currentUser } = useAuth();
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Only show for superadmin
  if (!currentUser || currentUser.role !== 'superadmin') {
    return null;
  }

  const handleDeleteUser = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'superadmin') {
      toast.error("Unauthorized to perform this action");
      return;
    }

    if (userId === currentUser.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    setDeletingUser(userId);
    try {
      const { error: publicUserError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (publicUserError) {
        throw publicUserError;
      }
      
      toast.success("User removed successfully");
      refetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to remove user");
    } finally {
      setDeletingUser(null);
      setUserToDelete(null);
    }
  };

  const canDeleteUser = (targetUser: any) => {
    if (targetUser.id === currentUser?.id) return false;
    return currentUser?.role === 'superadmin';
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            <span className="ml-2">Loading users...</span>
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
                placeholder="Search users by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <UserManagementTable
            users={filteredUsers}
            currentUserId={currentUser?.id}
            canDeleteUser={canDeleteUser}
            deletingUser={deletingUser}
            onDeleteClick={setUserToDelete}
            onRoleChanged={refetchUsers}
          />
        </CardContent>
      </Card>

      <UserDeleteDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => userToDelete && handleDeleteUser(userToDelete)}
      />
    </>
  );
};

export default AdminUserManagement;
