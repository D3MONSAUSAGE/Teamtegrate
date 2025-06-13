
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Users, 
  UserPlus,
  Shield,
  UserCheck,
  User,
  MoreVertical,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
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
import { useEnhancedUserManagement } from '@/hooks/useEnhancedUserManagement';
import { UserRole } from '@/types';
import { format } from 'date-fns';
import CreateUserDialog from './CreateUserDialog';
import EditUserDialog from './EditUserDialog';
import DeleteUserDialog from './DeleteUserDialog';
import UserImpactDialog from './UserImpactDialog';

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

const SuperadminUserManagement: React.FC = () => {
  const {
    users,
    isLoading,
    error,
    isSuperadmin,
    createUser,
    updateUserProfile,
    deleteUser,
    changeUserRole,
    getUserImpactAnalysis
  } = useEnhancedUserManagement();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [impactDialogOpen, setImpactDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleQuickRoleChange = async (userId: string, newRole: UserRole) => {
    await changeUserRole(userId, newRole);
  };

  const handleViewImpact = async (user: any) => {
    setSelectedUser(user);
    setImpactDialogOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enhanced User Management
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
            Enhanced User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-center py-4">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enhanced User Management
            <Badge variant="outline" className="ml-auto">
              {filteredUsers.length} Users
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Roles</option>
                <option value="superadmin">Superadmin</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="user">User</option>
              </select>

              <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add User
              </Button>
            </div>

            {/* Users Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Quick Actions</TableHead>
                    <TableHead className="text-right">More</TableHead>
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
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {user.role !== 'superadmin' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleQuickRoleChange(user.id, 
                                user.role === 'admin' ? 'superadmin' : 
                                user.role === 'manager' ? 'admin' : 
                                user.role === 'user' ? 'manager' : 'user'
                              )}
                              className="h-8 w-8 p-0"
                              title="Promote"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                          )}
                          
                          {user.role !== 'user' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleQuickRoleChange(user.id,
                                user.role === 'superadmin' ? 'admin' : 
                                user.role === 'admin' ? 'manager' : 
                                user.role === 'manager' ? 'user' : 'user'
                              )}
                              className="h-8 w-8 p-0"
                              title="Demote"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            
                            <DropdownMenuItem onClick={() => handleViewImpact(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Impact
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Profile
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onUserCreated={() => {}}
      />

      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        onUserUpdated={() => {}}
      />

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={selectedUser}
        onUserDeleted={() => {}}
      />

      <UserImpactDialog
        open={impactDialogOpen}
        onOpenChange={setImpactDialogOpen}
        user={selectedUser}
      />
    </>
  );
};

export default SuperadminUserManagement;
