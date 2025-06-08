
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserCog, Loader2, Star, Shield, Crown, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, getRoleDisplayName, canManageUser, hasRoleAccess } from '@/types';

interface RoleManagementProps {
  targetUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onRoleChanged: () => void;
}

const RoleManagement: React.FC<RoleManagementProps> = ({ targetUser, onRoleChanged }) => {
  const { user: currentUser } = useAuth();
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [newRole, setNewRole] = useState<UserRole | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  if (!currentUser || !hasRoleAccess(currentUser.role, 'admin')) {
    return null;
  }

  const currentTargetRole = targetUser.role as UserRole;
  const canManageThisUser = canManageUser(currentUser.role, currentTargetRole);

  if (!canManageThisUser) {
    return null;
  }

  const handleRoleChange = async () => {
    if (!newRole || !currentUser) return;

    setIsChangingRole(true);
    try {
      // Update in auth metadata
      const { error: authError } = await supabase.auth.admin.updateUserById(
        targetUser.id,
        {
          user_metadata: { role: newRole }
        }
      );

      if (authError) {
        console.error('Auth update error:', authError);
      }

      // Update in users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', targetUser.id);

      if (dbError) {
        throw dbError;
      }

      toast.success(`Role updated to ${getRoleDisplayName(newRole)} successfully`);
      onRoleChanged();
      setConfirmDialogOpen(false);
      setNewRole(null);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setIsChangingRole(false);
    }
  };

  const getAvailableRoles = (): UserRole[] => {
    const roles: UserRole[] = [];
    
    // Users can always be demoted to user level
    roles.push('user');
    
    // Add roles based on current user's permissions
    if (hasRoleAccess(currentUser.role, 'manager')) {
      roles.push('manager');
    }
    
    if (hasRoleAccess(currentUser.role, 'admin')) {
      roles.push('admin');
    }
    
    // Only superadmins can create other superadmins
    if (currentUser.role === 'superadmin') {
      roles.push('superadmin');
    }
    
    return roles.filter(role => role !== currentTargetRole);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return <Star className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'manager':
        return <Crown className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const availableRoles = getAvailableRoles();

  if (availableRoles.length === 0) {
    return null;
  }

  return (
    <>
      <Select onValueChange={(value) => { setNewRole(value as UserRole); setConfirmDialogOpen(true); }}>
        <SelectTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isChangingRole}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            {isChangingRole ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserCog className="h-4 w-4" />
            )}
          </Button>
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map((role) => (
            <SelectItem key={role} value={role}>
              <div className="flex items-center gap-2">
                {getRoleIcon(role)}
                {getRoleDisplayName(role)}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change {targetUser.name}'s role from{' '}
              <Badge variant="outline" className="mx-1">
                {getRoleDisplayName(currentTargetRole)}
              </Badge>
              to{' '}
              <Badge variant="outline" className="mx-1">
                {newRole ? getRoleDisplayName(newRole) : ''}
              </Badge>
              ?
              <br /><br />
              This will change their access permissions throughout the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewRole(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRoleChange}
              disabled={isChangingRole}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isChangingRole ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RoleManagement;
