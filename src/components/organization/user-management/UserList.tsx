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
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Loader2, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserType, UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Eye, ExternalLink } from 'lucide-react';

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
}

const UserList: React.FC<UserListProps> = ({
  users,
  updatingUserId,
  onRoleChange,
  onEditUser,
  onDeleteUser
}) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const canManageRole = (targetRole: string): boolean => {
    if (!currentUser) return false;
    
    const currentRole = currentUser.role;
    
    // Superadmin can manage everyone except other superadmins
    if (currentRole === 'superadmin' && targetRole !== 'superadmin') return true;
    
    // Admin can manage managers and users
    if (currentRole === 'admin' && ['manager', 'user'].includes(targetRole)) return true;
    
    // Manager can manage users only
    if (currentRole === 'manager' && targetRole === 'user') return true;
    
    return false;
  };

  const getAvailableRoles = (currentRole: string): UserRole[] => {
    if (!currentUser) return [];
    
    const userRole = currentUser.role;
    
    if (userRole === 'superadmin') {
      return currentRole === 'superadmin' ? [] : ['admin', 'manager', 'user'];
    }
    
    if (userRole === 'admin') {
      return ['manager', 'user'];
    }
    
    if (userRole === 'manager') {
      return currentRole === 'user' ? ['user'] : [];
    }
    
    return [];
  };

  const handleViewDashboard = (userId: string) => {
    navigate(`/dashboard/organization/employee/${userId}`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
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
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onEditUser(user)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit User
                      </DropdownMenuItem>
                      
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
