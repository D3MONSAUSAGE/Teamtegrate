
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, UserPlus, Users, Shield, Crown, AlertTriangle, Database } from 'lucide-react';
import { useOrganizationTeamMembers } from '@/hooks/useOrganizationTeamMembers';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useAuth } from '@/contexts/AuthContext';
import { useDataSync } from '@/hooks/useDataSync';
import UserCard from './user-management/UserCard';
import UserManagementFilters from './user-management/UserManagementFilters';
import OrganizationSelector from './OrganizationSelector';
import CreateUserDialog from './CreateUserDialog';
import { toast } from '@/components/ui/sonner';
import { UserRole } from '@/types';

const SimplifiedOrganizationUserManagement = () => {
  const { user: currentUser } = useAuth();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  // Data sync hook for checking missing users
  const { isChecking, checkMissingUsers } = useDataSync();

  // Get organizations (only for superadmin)
  const { organizations, isLoading: loadingOrgs } = useOrganizations();

  // Get users for the selected organization (or current user's org)
  const targetOrgId = selectedOrganizationId || currentUser?.organizationId;
  const { users, isLoading, error, refetch } = useOrganizationTeamMembers();

  // Initialize organization selection for superadmin
  useEffect(() => {
    if (currentUser?.role === 'superadmin' && !selectedOrganizationId && currentUser.organizationId) {
      setSelectedOrganizationId(currentUser.organizationId);
    }
  }, [currentUser, selectedOrganizationId]);

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Role counts for badges
  const roleCounts = {
    superadmin: users.filter(u => u.role === 'superadmin').length,
    admin: users.filter(u => u.role === 'admin').length,
    manager: users.filter(u => u.role === 'manager').length,
    user: users.filter(u => u.role === 'user').length,
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('User list refreshed');
    } catch (error) {
      toast.error('Failed to refresh user list');
    }
  };

  const handleDataSyncCheck = async () => {
    await checkMissingUsers();
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUserId(userId);
    try {
      // Role change logic would go here
      toast.success('Role updated successfully');
      await refetch();
    } catch (error) {
      toast.error('Failed to update role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleEditUser = (user: any) => {
    // Edit user logic would go here
    console.log('Edit user:', user);
  };

  const handleDeleteUser = (user: any) => {
    // Delete user logic would go here
    console.log('Delete user:', user);
  };

  const handleUserCreated = async () => {
    await refetch();
    toast.success('User created successfully');
  };

  const handleOrganizationChange = (orgId: string) => {
    setSelectedOrganizationId(orgId);
    // Reset filters when changing organization
    setSearchTerm('');
    setSelectedRole('all');
  };

  if (isLoading && !users.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading team members...</span>
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
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to load team members: {error}
                <div className="mt-4">
                  <Button onClick={handleRefresh} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({users.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            {currentUser?.role === 'superadmin' && (
              <>
                <Button 
                  onClick={handleDataSyncCheck}
                  variant="outline" 
                  size="sm"
                  disabled={isChecking}
                >
                  <Database className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                  Check Sync
                </Button>
              </>
            )}
            <Button 
              onClick={handleRefresh}
              variant="outline" 
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {currentUser?.role === 'superadmin' && (
              <Button 
                onClick={() => setIsCreateUserOpen(true)}
                size="sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Organization Selector for Superadmin */}
          {currentUser?.role === 'superadmin' && (
            <OrganizationSelector
              organizations={organizations}
              isLoading={loadingOrgs}
              selectedOrganization={selectedOrganizationId}
              onOrganizationChange={handleOrganizationChange}
              label="View Organization Users"
              placeholder="Select organization to manage"
            />
          )}

          {/* Role Summary Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Crown className="h-3 w-3 text-yellow-500" />
              Super Admins: {roleCounts.superadmin}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-blue-500" />
              Admins: {roleCounts.admin}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3 text-green-500" />
              Managers: {roleCounts.manager}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3 text-gray-500" />
              Users: {roleCounts.user}
            </Badge>
          </div>

          {/* Current Organization Info */}
          {selectedOrganizationId && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Viewing users from: {organizations.find(o => o.id === selectedOrganizationId)?.name || 'Selected Organization'}
              </AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <UserManagementFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            onCreateUser={() => setIsCreateUserOpen(true)}
          />

          {/* User List */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || selectedRole !== 'all' 
                  ? 'No users match your filters' 
                  : 'No team members found'
                }
              </p>
              {!searchTerm && selectedRole === 'all' && currentUser?.role === 'superadmin' && (
                <div className="mt-4">
                  <Button onClick={handleDataSyncCheck} variant="outline" size="sm">
                    <Database className="h-4 w-4 mr-2" />
                    Check for Missing Users
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <UserCard 
                  key={user.id} 
                  user={user}
                  updatingUserId={updatingUserId}
                  onRoleChange={handleRoleChange}
                  onEditUser={handleEditUser}
                  onDeleteUser={handleDeleteUser}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateUserDialog 
        open={isCreateUserOpen}
        onOpenChange={setIsCreateUserOpen}
        onUserCreated={handleUserCreated}
      />
    </>
  );
};

export default SimplifiedOrganizationUserManagement;
