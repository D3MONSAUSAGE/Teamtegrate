import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Loader2, Edit, Trash2, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserType, UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Eye, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useUserJobRoles } from '@/hooks/useUserJobRoles';
import JobRoleBadge from '@/components/JobRoleBadge';
import UserJobRolesCell from './UserJobRolesCell';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organization_id: string;
  created_at: string;
  assigned_tasks_count: number;
  completed_tasks_count: number;
  role_level: number;
}

interface UserListProps {
  users: User[];
  updatingUserId: string | null;
  onRoleChange: (userId: string, newRole: UserRole) => Promise<void>;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onResetPassword?: (user: User) => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  updatingUserId,
  onRoleChange,
  onEditUser,
  onDeleteUser,
  onResetPassword
}) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const canManageRole = (targetRole: string): boolean => {
    if (!currentUser) return false;
    
    const currentRole = currentUser.role;
    
    // Superadmin can manage everyone except other superadmins
    if (currentRole === 'superadmin' && targetRole !== 'superadmin') return true;
    
    // Admin can manage managers, team_leaders and users
    if (currentRole === 'admin' && ['manager', 'team_leader', 'user'].includes(targetRole)) return true;
    
    // Manager can manage team_leaders and users
    if (currentRole === 'manager' && ['team_leader', 'user'].includes(targetRole)) return true;
    
    return false;
  };

  const getAvailableRoles = (currentRole: string): UserRole[] => {
    if (!currentUser) return [];
    
    const userRole = currentUser.role;
    let roles: UserRole[] = [];
    
    if (userRole === 'superadmin') {
      roles = ['superadmin', 'admin', 'manager', 'team_leader', 'user'];
    } else if (userRole === 'admin') {
      roles = ['manager', 'team_leader', 'user'];
    } else if (userRole === 'manager') {
      roles = ['team_leader', 'user'];
    }
    
    // Exclude the target's current role to avoid redundant action
    return roles.filter(r => r !== (currentRole as UserRole));
  };

  const handleViewDashboard = (userId: string) => {
    navigate(`/dashboard/organization/employee/${userId}`);
  };

  const handleResetPassword = async (user: User) => {
    if (onResetPassword) {
      onResetPassword(user);
    } else {
      // Fallback to basic implementation
      try {
        const { data, error } = await supabase.functions.invoke('admin-reset-password', {
          body: {
            email: user.email,
            action: 'send_recovery_link'
          }
        });

        if (error) throw error;

        toast.success(`Password reset link sent to ${user.email}`);
      } catch (error: any) {
        console.error('Password reset failed:', error);
        toast.error(error.message || 'Failed to send password reset link');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Job Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <UserJobRolesCell userId={user.id} />
                </TableCell>
                <TableCell>{user.created_at}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        disabled={updatingUserId === user.id}
                      >
                        {updatingUserId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreVertical className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {isAdmin && user.id !== currentUser?.id && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => handleViewDashboard(user.id)}
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      
                      {/* Role Change Options */}
                      {canManageRole(user.role) && user.id !== currentUser?.id && getAvailableRoles(user.role).length > 0 && (
                        <>
                          <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                          {getAvailableRoles(user.role).map((role) => (
                            <DropdownMenuItem
                              key={role}
                              onClick={() => onRoleChange(user.id, role)}
                              disabled={updatingUserId === user.id}
                              className="flex items-center gap-2 pl-6"
                            >
                              Change to {role.charAt(0).toUpperCase() + role.slice(1)}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                        </>
                      )}
                      
                      <DropdownMenuItem
                        onClick={() => onEditUser(user)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit User
                      </DropdownMenuItem>
                      
                      {isAdmin && user.id !== currentUser?.id && (
                        <DropdownMenuItem
                          onClick={() => handleResetPassword(user)}
                          className="flex items-center gap-2"
                        >
                          <Key className="h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                      )}
                      
                      {user.id !== currentUser?.id && (
                        <DropdownMenuItem
                          onClick={() => onDeleteUser(user)}
                          className="flex items-center gap-2 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserList;
