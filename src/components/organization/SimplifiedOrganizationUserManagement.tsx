
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, UserPlus, Users, Shield, Crown } from 'lucide-react';
import { useOrganizationTeamMembers } from '@/hooks/useOrganizationTeamMembers';
import { useAuth } from '@/contexts/AuthContext';
import UserCard from './user-management/UserCard';
import UserManagementFilters from './user-management/UserManagementFilters';
import CreateUserDialog from './CreateUserDialog';
import { toast } from '@/components/ui/sonner';

const SimplifiedOrganizationUserManagement = () => {
  const { user: currentUser } = useAuth();
  const { users, isLoading, error, refetch } = useOrganizationTeamMembers();
  
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'manager': return <Users className="h-4 w-4 text-green-500" />;
      default: return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
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
            <p className="text-destructive mb-4">Failed to load team members: {error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
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

          {/* Filters */}
          <UserManagementFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
          />

          {/* User List */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || roleFilter !== 'all' 
                  ? 'No users match your filters' 
                  : 'No team members found'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <UserCard 
                  key={user.id} 
                  user={user} 
                  currentUser={currentUser}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateUserDialog 
        open={isCreateUserOpen}
        onOpenChange={setIsCreateUserOpen}
      />
    </>
  );
};

export default SimplifiedOrganizationUserManagement;
