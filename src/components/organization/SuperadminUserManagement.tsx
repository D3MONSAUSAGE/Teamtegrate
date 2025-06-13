
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
  Eye,
  Loader2,
  ArrowUp,
  ArrowDown,
  Crown
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEnhancedUserManagement } from '@/hooks/useEnhancedUserManagement';
import { UserRole } from '@/types';
import { format } from 'date-fns';
import CreateUserDialog from './CreateUserDialog';
import EditUserDialog from './EditUserDialog';
import DeleteUserDialog from './DeleteUserDialog';
import UserImpactDialog from './UserImpactDialog';
import SuperadminTransferDialog from './SuperadminTransferDialog';

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'superadmin':
      return <Crown className="h-4 w-4 text-yellow-500" />;
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
      return 'default';
    case 'admin':
      return 'destructive';
    case 'manager':
      return 'secondary';
    case 'user':
      return 'outline';
    default:
      return 'outline';
  }
};

interface SuperadminTransferData {
  targetUserId: string;
  targetUserName: string;
  currentSuperadminId: string;
  currentSuperadminName: string;
}

const SuperadminUserManagement: React.FC = () => {
  const {
    users,
    isLoading,
    error,
    isSuperadmin,
    changeUserRole,
    transferSuperadminRole
  } = useEnhancedUserManagement();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [impactDialogOpen, setImpactDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [transferData, setTransferData] = useState<SuperadminTransferData | null>(null);

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
    setUpdatingUserId(userId);
    
    try {
      const result = await changeUserRole(userId, newRole);
      
      if (result.requiresTransfer && result.transferData) {
        setTransferData(result.transferData);
        setTransferDialogOpen(true);
      }
    } catch (error) {
      console.error('Error changing role:', error);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleSuperadminTransfer = async (transferData: SuperadminTransferData) => {
    setIsTransferring(true);
    try {
      await transferSuperadminRole(transferData);
    } catch (error) {
      console.error('Error transferring superadmin role:', error);
    } finally {
      setIsTransferring(false);
    }
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
          {currentSuperadmin && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span>Current Superadmin: <strong>{currentSuperadmin.name}</strong></span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters and Search */}
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

            {/* User Cards Grid */}
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center justify-between">
                    {/* User Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">
                          {user.name.substring(0, 1).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{user.name}</h3>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(user.role as UserRole)}
                            <Badge variant={getRoleBadgeVariant(user.role as UserRole)} className="text-xs">
                              {user.role}
                            </Badge>
                            {user.role === 'superadmin' && (
                              <Badge variant="outline" className="text-xs text-yellow-600">
                                Only One Allowed
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="truncate">{user.email}</span>
                          <span>{user.assigned_tasks_count || 0} tasks</span>
                          <span>Joined {format(new Date(user.created_at), 'MMM yyyy')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Role Actions */}
                    <div className="flex items-center gap-1 ml-2">
                      {/* Quick Role Change Buttons */}
                      {user.role !== 'superadmin' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleQuickRoleChange(user.id, 
                            user.role === 'admin' ? 'superadmin' : 
                            user.role === 'manager' ? 'admin' : 'manager'
                          )}
                          className="h-8 w-8 p-0"
                          disabled={updatingUserId === user.id}
                          title={user.role === 'admin' ? 'Promote to Superadmin (will transfer role)' : 'Promote'}
                        >
                          {updatingUserId === user.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ArrowUp className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      
                      {user.role !== 'user' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleQuickRoleChange(user.id,
                            user.role === 'superadmin' ? 'admin' : 
                            user.role === 'admin' ? 'manager' : 'user'
                          )}
                          className="h-8 w-8 p-0"
                          disabled={updatingUserId === user.id}
                          title="Demote"
                        >
                          {updatingUserId === user.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )}
                        </Button>
                      )}

                      {/* More Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border shadow-md">
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
                    </div>
                  </div>
                </Card>
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No users found</p>
                </div>
              )}
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

      <SuperadminTransferDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        transferData={transferData}
        onConfirm={handleSuperadminTransfer}
        isTransferring={isTransferring}
      />
    </>
  );
};

export default SuperadminUserManagement;
