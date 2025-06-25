
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
import { Shield, Crown, Users, AlertTriangle } from 'lucide-react';
import { UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface WorkingRoleManagementProps {
  targetUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onRoleChanged: () => void;
}

const WorkingRoleManagement: React.FC<WorkingRoleManagementProps> = ({ 
  targetUser, 
  onRoleChanged 
}) => {
  const { user: currentUser } = useAuth();
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [newRole, setNewRole] = useState<UserRole | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [requiresTransfer, setRequiresTransfer] = useState(false);
  const [currentSuperadminName, setCurrentSuperadminName] = useState<string>('');

  const currentTargetRole = targetUser.role as UserRole;

  // Enhanced role management permissions
  const canManageThisUser = currentUser && (() => {
    // Superadmin can manage everyone except themselves
    if (currentUser.role === 'superadmin' && targetUser.id !== currentUser.id) {
      return true;
    }
    
    // Admin can manage managers and users (but not superadmins or other admins)
    if (currentUser.role === 'admin' && 
        ['manager', 'user'].includes(currentTargetRole) && 
        targetUser.id !== currentUser.id) {
      return true;
    }
    
    return false;
  })();

  const getAvailableRoles = (): UserRole[] => {
    if (!currentUser || !canManageThisUser) return [];
    
    const roles: UserRole[] = [];
    
    if (currentUser.role === 'superadmin') {
      // Superadmin can assign any role except to themselves
      roles.push('user', 'manager', 'admin', 'superadmin');
    } else if (currentUser.role === 'admin') {
      // Admin can only assign user and manager roles
      roles.push('user', 'manager');
    }
    
    return roles.filter(role => role !== currentTargetRole);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'superadmin': return <Crown className="h-3 w-3" />;
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'manager': return <Users className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'superadmin': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'manager': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleRoleSelect = async (role: UserRole) => {
    setNewRole(role);
    
    // Check if this requires superadmin transfer
    if (role === 'superadmin' && currentTargetRole !== 'superadmin') {
      try {
        const { data, error } = await supabase.rpc('can_change_user_role', {
          manager_user_id: currentUser?.id,
          target_user_id: targetUser.id,
          new_role: role
        });

        if (error) throw error;

        if (data?.requires_transfer) {
          setRequiresTransfer(true);
          setCurrentSuperadminName(data.current_superadmin_name || 'Current Superadmin');
        }
      } catch (error) {
        console.error('Error checking role change requirements:', error);
        toast.error('Failed to validate role change');
        return;
      }
    }
    
    setConfirmDialogOpen(true);
  };

  const handleRoleChange = async () => {
    if (!newRole || !currentUser || !canManageThisUser) return;

    setIsChangingRole(true);
    try {
      console.log('Calling update-user-role function with:', {
        targetUserId: targetUser.id,
        newRole: newRole
      });

      const { data, error } = await supabase.functions.invoke('update-user-role', {
        body: {
          targetUserId: targetUser.id,
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
      
      let successMessage = `Role updated to ${newRole} successfully`;
      if (requiresTransfer) {
        successMessage = `${targetUser.name} promoted to superadmin. ${currentSuperadminName} has been demoted to admin.`;
      }
      
      toast.success(successMessage);
      onRoleChanged();
      setConfirmDialogOpen(false);
      setNewRole(null);
      setRequiresTransfer(false);
      setCurrentSuperadminName('');
    } catch (error) {
      console.error('Error updating role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update role';
      toast.error(errorMessage);
    } finally {
      setIsChangingRole(false);
    }
  };

  const handleDialogClose = () => {
    setConfirmDialogOpen(false);
    setNewRole(null);
    setRequiresTransfer(false);
    setCurrentSuperadminName('');
  };

  if (!canManageThisUser) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={getRoleColor(currentTargetRole)}>
          {getRoleIcon(currentTargetRole)}
          <span className="ml-1 capitalize">{currentTargetRole}</span>
        </Badge>
      </div>
    );
  }

  const availableRoles = getAvailableRoles();

  if (availableRoles.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={getRoleColor(currentTargetRole)}>
          {getRoleIcon(currentTargetRole)}
          <span className="ml-1 capitalize">{currentTargetRole}</span>
        </Badge>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={getRoleColor(currentTargetRole)}>
          {getRoleIcon(currentTargetRole)}
          <span className="ml-1 capitalize">{currentTargetRole}</span>
        </Badge>
        
        <Select onValueChange={handleRoleSelect} disabled={isChangingRole}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Change" />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map((role) => (
              <SelectItem key={role} value={role}>
                <div className="flex items-center gap-2">
                  {getRoleIcon(role)}
                  <span className="capitalize">{role}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={handleDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {requiresTransfer && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
              Confirm Role Change
            </AlertDialogTitle>
            <AlertDialogDescription>
              {requiresTransfer ? (
                <div className="space-y-2">
                  <p>
                    You are about to promote <strong>{targetUser.name}</strong> to <strong>superadmin</strong>.
                  </p>
                  <p className="text-yellow-600 font-medium">
                    This will automatically demote <strong>{currentSuperadminName}</strong> to <strong>admin</strong> 
                    since each organization can only have one superadmin.
                  </p>
                  <p>Are you sure you want to proceed?</p>
                </div>
              ) : (
                <>
                  Are you sure you want to change <strong>{targetUser.name}</strong>'s role 
                  from <strong>{currentTargetRole}</strong> to <strong>{newRole}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDialogClose}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange} disabled={isChangingRole}>
              {isChangingRole ? 'Updating...' : 'Confirm Change'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WorkingRoleManagement;
