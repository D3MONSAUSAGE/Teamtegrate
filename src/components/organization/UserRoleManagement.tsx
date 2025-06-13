
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Users, 
  Shield, 
  UserCheck, 
  User,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrganizationUsers } from '@/hooks/useOrganizationUsers';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { format } from 'date-fns';

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'superadmin':
      return <Shield className="h-4 w-4 text-red-500" />;
    case 'admin':
      return <Shield className="h-4 w-4 text-orange-500" />;
    case 'manager':
      return <UserCheck className="h-4 w-4 text-blue-500" />;
    case 'user':
      return <User className="h-4 w-4 text-green-500" />;
    default:
      return <User className="h-4 w-4 text-gray-500" />;
  }
};

const getRoleBadgeVariant = (role: UserRole) => {
  switch (role) {
    case 'superadmin':
      return 'destructive';
    case 'admin':
      return 'default';
    case 'manager':
      return 'secondary';
    case 'user':
      return 'outline';
    default:
      return 'outline';
  }
};

const UserRoleManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { users, isLoading, error, updateUserRole } = useOrganizationUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const canManageRole = (targetRole: UserRole): boolean => {
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

  const getAvailableRoles = (currentRole: UserRole): UserRole[] => {
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

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUserId(userId);
    await updateUserRole(userId, newRole);
    setUpdatingUserId(null);
  };

  const filteredUsers = users?.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management
          <Badge variant="outline" className="ml-auto">
            {filteredUsers.length} Users
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {user.name.substring(0, 1).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role as UserRole)}
                        <Badge variant={getRoleBadgeVariant(user.role as UserRole)}>
                          {user.role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{user.assigned_tasks_count || 0} assigned</div>
                        <div className="text-muted-foreground">
                          {user.completed_tasks_count || 0} completed
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(user.created_at), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManageRole(user.role as UserRole) && user.id !== currentUser?.id && (
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
                            <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {getAvailableRoles(user.role as UserRole).map((role) => (
                              <DropdownMenuItem
                                key={role}
                                onClick={() => handleRoleChange(user.id, role)}
                                className="flex items-center gap-2"
                              >
                                {getRoleIcon(role)}
                                <span className="capitalize">{role}</span>
                                {role === 'admin' && <ChevronUp className="h-3 w-3 ml-auto" />}
                                {role === 'user' && <ChevronDown className="h-3 w-3 ml-auto" />}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserRoleManagement;
