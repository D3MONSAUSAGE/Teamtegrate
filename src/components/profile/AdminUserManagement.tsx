
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/types';
import UserManagementHeader from './UserManagementHeader';
import UserManagementTable from './UserManagementTable';
import UserDeleteDialog from './UserDeleteDialog';

const AdminUserManagement = () => {
  const { users, isLoading, refetchUsers } = useUsers();
  const { user: currentUser } = useAuth();
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  // Only show for admins and above
  if (!currentUser || !hasRoleAccess(currentUser.role, 'admin')) {
    return null;
  }

  const handleDeleteUser = async (userId: string) => {
    if (!currentUser || !hasRoleAccess(currentUser.role, 'admin')) {
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
    if (currentUser?.role === 'superadmin') return true;
    if (currentUser?.role === 'admin' && ['manager', 'user'].includes(targetUser.role)) return true;
    return false;
  };

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
        <UserManagementHeader userCount={users.length} />
        <CardContent>
          <UserManagementTable
            users={users}
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
